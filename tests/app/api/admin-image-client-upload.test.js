import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TEST_SESSION_SECRET = "test-session-secret-that-is-at-least-32-characters";

const { cookiesMock, handleUploadMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  handleUploadMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@vercel/blob/client", () => ({
  handleUpload: handleUploadMock,
}));

import { createAdminSession } from "../../../lib/session";
import { POST as clientUploadRoute } from "../../../app/api/admin/uploads/image/client/route";

describe("admin image client upload token api", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_SECRET", TEST_SESSION_SECRET);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects token requests without a valid admin session", async () => {
    cookiesMock.mockResolvedValue({
      get() {
        return undefined;
      },
    });
    handleUploadMock.mockImplementation(async ({ onBeforeGenerateToken }) => {
      await onBeforeGenerateToken("admin-images/mobile.jpg", null, true);
    });

    const response = await clientUploadRoute(new Request("http://localhost:3000/api/admin/uploads/image/client", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "blob.generate-client-token",
        payload: {
          pathname: "admin-images/mobile.jpg",
          multipart: true,
          clientPayload: null,
        },
      }),
    }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ message: "Unauthorized" });
  });

  it("generates a constrained client upload token for authenticated photo uploads", async () => {
    const token = await createAdminSession({ username: "admin" });
    cookiesMock.mockResolvedValue({
      get() {
        return { value: token };
      },
    });
    handleUploadMock.mockImplementation(async ({ onBeforeGenerateToken }) => {
      const constraints = await onBeforeGenerateToken("admin-images/mobile.jpg", null, true);
      return {
        type: "blob.generate-client-token",
        clientToken: `token:${constraints.maximumSizeInBytes}:${constraints.allowedContentTypes.join(",")}`,
      };
    });

    const response = await clientUploadRoute(new Request("http://localhost:3000/api/admin/uploads/image/client", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "blob.generate-client-token",
        payload: {
          pathname: "admin-images/mobile.jpg",
          multipart: true,
          clientPayload: null,
        },
      }),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      type: "blob.generate-client-token",
      clientToken: "token:52428800:image/*",
    });
  });
});
