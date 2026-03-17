import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock, createMediaAssetMock, uploadAdminImageMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  createMediaAssetMock: vi.fn(),
  uploadAdminImageMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("../../../lib/repositories/media-assets", () => ({
  createMediaAsset: createMediaAssetMock,
}));

vi.mock("../../../lib/media-storage", () => ({
  uploadAdminImage: uploadAdminImageMock,
}));

import { createAdminSession } from "../../../lib/session";
import { POST as imageUploadRoute } from "../../../app/api/admin/uploads/image/route";

describe("admin image upload api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects upload requests without a valid admin session", async () => {
    cookiesMock.mockResolvedValue({
      get() {
        return undefined;
      },
    });

    const formData = new FormData();
    formData.set("file", new File(["png"], "pasted.png", { type: "image/png" }));

    const response = await imageUploadRoute(new Request("http://localhost:3000/api/admin/uploads/image", {
      method: "POST",
      body: formData,
    }));

    expect(response.status).toBe(401);
  });

  it("rejects non-image files", async () => {
    const token = await createAdminSession({ username: "admin" });
    cookiesMock.mockResolvedValue({
      get() {
        return { value: token };
      },
    });

    const formData = new FormData();
    formData.set("file", new File(["text"], "note.txt", { type: "text/plain" }));

    const response = await imageUploadRoute(new Request("http://localhost:3000/api/admin/uploads/image", {
      method: "POST",
      body: formData,
    }));

    expect(response.status).toBe(400);
    expect(uploadAdminImageMock).not.toHaveBeenCalled();
  });

  it("returns uploaded image metadata for authenticated image uploads", async () => {
    const token = await createAdminSession({ username: "admin" });
    cookiesMock.mockResolvedValue({
      get() {
        return { value: token };
      },
    });
    uploadAdminImageMock.mockResolvedValue({
      url: "https://blob.example/test.png",
      pathname: "admin-images/test.png",
      mimeType: "image/png",
      size: 1234,
      width: 800,
      height: 600,
    });
    createMediaAssetMock.mockResolvedValue({
      id: "asset-1",
      url: "https://blob.example/test.png",
    });

    const formData = new FormData();
    formData.set("file", new File(["png"], "pasted.png", { type: "image/png" }));

    const response = await imageUploadRoute(new Request("http://localhost:3000/api/admin/uploads/image", {
      method: "POST",
      body: formData,
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(uploadAdminImageMock).toHaveBeenCalled();
    expect(createMediaAssetMock).toHaveBeenCalledWith({
      url: "https://blob.example/test.png",
      pathname: "admin-images/test.png",
      mimeType: "image/png",
      size: 1234,
      width: 800,
      height: 600,
    });
    expect(body).toEqual({
      url: "https://blob.example/test.png",
      pathname: "admin-images/test.png",
      mimeType: "image/png",
      size: 1234,
      width: 800,
      height: 600,
    });
  });
});
