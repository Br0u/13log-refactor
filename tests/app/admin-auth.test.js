import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const TEST_SESSION_SECRET = "test-session-secret-that-is-at-least-32-characters";

const { redirectMock, requireAdminSessionMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  requireAdminSessionMock: vi.fn(),
}));

vi.mock("../../lib/auth", async () => {
  const actual = await vi.importActual("../../lib/auth");
  return {
    ...actual,
    verifyAdminLogin: vi.fn(async (username, password) => {
      if (username === "admin" && password === "0hqlP1LSARqnUKdH") {
        return { username: "admin" };
      }
      throw new Error("Invalid credentials");
    }),
  };
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("../../lib/admin-session", () => ({
  requireAdminSession: requireAdminSessionMock,
}));

import ProtectedAdminLayout from "../../app/admin/(protected)/layout";
import { POST as loginRoute } from "../../app/api/admin/login/route";
import { POST as logoutRoute } from "../../app/api/admin/logout/route";

describe("admin auth", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_SECRET", TEST_SESSION_SECRET);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    vi.clearAllMocks();
    requireAdminSessionMock.mockImplementation(async () => redirectMock("/admin/login"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("requires an admin session before rendering the protected layout", async () => {
    await expect(ProtectedAdminLayout({ children: null })).rejects.toThrow("NEXT_REDIRECT");
    expect(requireAdminSessionMock).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
  });

  it("includes a Photos navigation item in the protected admin shell", async () => {
    requireAdminSessionMock.mockResolvedValue({
      username: "admin",
    });

    const markup = renderToStaticMarkup(await ProtectedAdminLayout({
      children: "<div>content</div>",
    }));

    expect(markup).toContain('href="/admin/photos"');
    expect(markup).toContain(">Photos<");
  });

  it("sets a session cookie when credentials are valid", async () => {
    const request = new Request("http://localhost:3000/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: "admin",
        password: "0hqlP1LSARqnUKdH",
      }),
    });

    const response = await loginRoute(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("admin_session=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=28800");
  });

  it("keeps invalid credentials as a 401 without a session cookie", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const request = new Request("http://localhost:3000/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: "admin",
        password: "wrong-password",
      }),
    });

    const response = await loginRoute(request);

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it.each([
    ["missing", ""],
    ["short", "short-session-secret"],
  ])("returns 500 without a cookie when valid credentials use a %s SESSION_SECRET", async (_label, secret) => {
    vi.stubEnv("SESSION_SECRET", secret);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const request = new Request("http://localhost:3000/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: "admin",
        password: "0hqlP1LSARqnUKdH",
      }),
    });

    const response = await loginRoute(request);

    expect(response.status).toBe(500);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(consoleErrorSpy.mock.calls).toEqual([
      ["Failed to create admin session"],
    ]);
  });

  it("clears the session cookie on logout and redirects to the site home page", async () => {
    const request = new Request("http://localhost:3000/api/admin/logout", {
      method: "POST",
    });

    const response = await logoutRoute(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
