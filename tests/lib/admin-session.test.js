import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock, readAdminSessionMock, redirectMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  readAdminSessionMock: vi.fn(),
  redirectMock: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("../../lib/session", async () => {
  const actual = await vi.importActual("../../lib/session");
  return {
    ...actual,
    readAdminSession: readAdminSessionMock,
  };
});

import { ADMIN_SESSION_COOKIE } from "../../lib/session";
import { requireAdminSession } from "../../lib/admin-session";

describe("requireAdminSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to login when the admin session cookie is missing", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => undefined),
    });
    readAdminSessionMock.mockResolvedValue(null);

    await expect(requireAdminSession()).rejects.toThrow("NEXT_REDIRECT");

    expect(cookiesMock).toHaveBeenCalledOnce();
    expect(readAdminSessionMock).toHaveBeenCalledWith("");
    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
  });

  it("redirects to login when the admin session cookie is invalid", async () => {
    const getCookie = vi.fn(() => ({ value: "invalid-token" }));
    cookiesMock.mockResolvedValue({ get: getCookie });
    readAdminSessionMock.mockResolvedValue(null);

    await expect(requireAdminSession()).rejects.toThrow("NEXT_REDIRECT");

    expect(getCookie).toHaveBeenCalledWith(ADMIN_SESSION_COOKIE);
    expect(readAdminSessionMock).toHaveBeenCalledWith("invalid-token");
    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
  });

  it("returns a valid admin session", async () => {
    const session = { username: "admin" };
    const getCookie = vi.fn(() => ({ value: "valid-token" }));
    cookiesMock.mockResolvedValue({ get: getCookie });
    readAdminSessionMock.mockResolvedValue(session);

    await expect(requireAdminSession()).resolves.toBe(session);

    expect(getCookie).toHaveBeenCalledWith(ADMIN_SESSION_COOKIE);
    expect(readAdminSessionMock).toHaveBeenCalledWith("valid-token");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
