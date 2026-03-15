import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { middleware } from "../../middleware";
import { POST as loginRoute } from "../../app/api/admin/login/route";
import { POST as logoutRoute } from "../../app/api/admin/logout/route";

describe("admin auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated admin requests to the login page", async () => {
    const request = {
      url: "http://localhost:3000/admin",
      nextUrl: new URL("http://localhost:3000/admin"),
      cookies: {
        get() {
          return undefined;
        },
      },
    };
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/admin/login");
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

  it("clears the session cookie on logout", async () => {
    const request = new Request("http://localhost:3000/api/admin/logout", {
      method: "POST",
    });

    const response = await logoutRoute(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
