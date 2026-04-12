import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock, createPhotoMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  createPhotoMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("../../../lib/repositories/photos", () => ({
  createPhoto: createPhotoMock,
}));

import { createAdminSession } from "../../../lib/session";
import { POST as adminPhotosRoute } from "../../../app/api/admin/photos/route";

describe("admin photos api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated photo creation requests", async () => {
    cookiesMock.mockResolvedValue({
      get() {
        return undefined;
      },
    });

    const response = await adminPhotosRoute(new Request("http://localhost:3000/api/admin/photos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ categoryId: "album-1", uploads: [] }),
    }));

    expect(response.status).toBe(401);
  });

  it("creates photo records from uploaded image metadata", async () => {
    const token = await createAdminSession({ username: "admin" });
    cookiesMock.mockResolvedValue({
      get() {
        return { value: token };
      },
    });

    const response = await adminPhotosRoute(new Request("http://localhost:3000/api/admin/photos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        categoryId: "album-1",
        title: "",
        caption: "Quiet stone",
        sortOrder: 7,
        uploads: [
          {
            url: "https://blob.example/first.jpg",
            pathname: "admin-images/first.jpg",
            fileName: "first.jpg",
          },
          {
            url: "https://blob.example/second.jpg",
            pathname: "admin-images/second.jpg",
            fileName: "second.jpg",
          },
        ],
      }),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(createPhotoMock).toHaveBeenNthCalledWith(1, {
      title: "first",
      caption: "Quiet stone",
      imageUrl: "https://blob.example/first.jpg",
      pathname: "admin-images/first.jpg",
      sortOrder: 7,
      categoryId: "album-1",
    });
    expect(createPhotoMock).toHaveBeenNthCalledWith(2, {
      title: "second",
      caption: "Quiet stone",
      imageUrl: "https://blob.example/second.jpg",
      pathname: "admin-images/second.jpg",
      sortOrder: 8,
      categoryId: "album-1",
    });
    expect(body).toEqual({ created: 2 });
  });

  it("skips invalid upload payloads but still saves valid images", async () => {
    const token = await createAdminSession({ username: "admin" });
    cookiesMock.mockResolvedValue({
      get() {
        return { value: token };
      },
    });

    const response = await adminPhotosRoute(new Request("http://localhost:3000/api/admin/photos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        categoryId: "album-1",
        uploads: [
          {
            url: "https://blob.example/first.jpg",
            pathname: "admin-images/first.jpg",
            fileName: "first.jpg",
          },
          {
            url: "",
            pathname: "",
            fileName: "broken.jpg",
          },
        ],
      }),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(createPhotoMock).toHaveBeenCalledTimes(1);
    expect(createPhotoMock).toHaveBeenCalledWith({
      title: "first",
      caption: "",
      imageUrl: "https://blob.example/first.jpg",
      pathname: "admin-images/first.jpg",
      sortOrder: null,
      categoryId: "album-1",
    });
    expect(body).toEqual({
      created: 1,
      failed: [
        { fileName: "broken.jpg", message: "Uploaded image metadata is incomplete." },
      ],
    });
  });
});
