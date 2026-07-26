import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TEST_SESSION_SECRET = "test-session-secret-that-is-at-least-32-characters";

const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

import { createAdminSession } from "../../../lib/session";
import { POST as markdownPreviewRoute } from "../../../app/api/admin/markdown-preview/route";

describe("admin markdown preview api", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_SECRET", TEST_SESSION_SECRET);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects requests without a valid admin session", async () => {
    cookiesMock.mockResolvedValue({
      get() {
        return undefined;
      },
    });

    const response = await markdownPreviewRoute(new Request("http://localhost:3000/api/admin/markdown-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "# test", mode: "post" }),
    }));

    expect(response.status).toBe(401);
  });

  it("renders post markdown previews for authenticated admin requests", async () => {
    const token = await createAdminSession({ username: "admin" });
    cookiesMock.mockResolvedValue({
      get() {
        return { value: token };
      },
    });

    const response = await markdownPreviewRoute(new Request("http://localhost:3000/api/admin/markdown-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "# Title", mode: "post" }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ html: "<h1>Title</h1>" });
  });

  it("renders micro post previews with preserved soft breaks", async () => {
    const token = await createAdminSession({ username: "admin" });
    cookiesMock.mockResolvedValue({
      get() {
        return { value: token };
      },
    });

    const response = await markdownPreviewRoute(new Request("http://localhost:3000/api/admin/markdown-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "第一行\n第二行", mode: "micro" }),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.html).toContain("第一行");
    expect(body.html).toContain("<br>");
    expect(body.html).toContain("第二行");
  });
});
