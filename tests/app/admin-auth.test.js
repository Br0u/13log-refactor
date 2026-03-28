import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { redirectMock, cookiesMock, readAdminSessionMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  cookiesMock: vi.fn(),
  readAdminSessionMock: vi.fn(),
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

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("../../lib/session", async () => {
  const actual = await vi.importActual("../../lib/session");
  return {
    ...actual,
    readAdminSession: readAdminSessionMock,
  };
});

import ProtectedAdminLayout from "../../app/admin/(protected)/layout";
import { POST as loginRoute } from "../../app/api/admin/login/route";
import { POST as logoutRoute } from "../../app/api/admin/logout/route";

describe("admin auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookiesMock.mockResolvedValue({
      get() {
        return undefined;
      },
    });
  });

  it("redirects unauthenticated admin layout requests to the login page", async () => {
    await expect(ProtectedAdminLayout({ children: null })).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
  });

  it("includes a Photos navigation item in the protected admin shell", async () => {
    cookiesMock.mockResolvedValue({
      get() {
        return { value: "admin-session-token" };
      },
    });
    readAdminSessionMock.mockResolvedValue({
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
