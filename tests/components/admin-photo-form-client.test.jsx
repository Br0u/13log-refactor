// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { refreshMock, uploadMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  uploadMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

vi.mock("@vercel/blob/client", () => ({
  upload: uploadMock,
}));

import AdminPhotoForm from "../../components/admin/AdminPhotoForm.jsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("admin photo form client upload", () => {
  it("uploads selected files first and then creates photo records from uploaded metadata", async () => {
    const fetchMock = vi.fn(async (url) => {
      return {
        ok: true,
        json: async () => ({ created: 2 }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    uploadMock.mockImplementation(async (_pathname, file, options) => {
      const callIndex = uploadMock.mock.calls.length;
      options.onUploadProgress?.({ percentage: 100 });
      return {
        url: `https://blob.example/${callIndex}.jpg`,
        pathname: `admin-images/${callIndex}.jpg`,
      };
    });

    const { container } = render(
      <AdminPhotoForm
        albumId="album-1"
        albumName="Random"
        createEndpoint="/api/admin/photos"
      />
    );

    const fileInput = container.querySelector('input[type="file"]');
    const first = new File(["a"], "first.jpg", { type: "image/jpeg", lastModified: 1 });
    const second = new File(["b"], "second.jpg", { type: "image/jpeg", lastModified: 2 });

    fireEvent.change(fileInput, { target: { files: [first, second] } });
    fireEvent.submit(container.querySelector("form"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/photos", expect.objectContaining({
        method: "POST",
      }));
    });

    expect(uploadMock).toHaveBeenNthCalledWith(1, expect.stringContaining("admin-images/"), first, expect.objectContaining({
      access: "public",
      handleUploadUrl: "/api/admin/uploads/image/client",
      contentType: "image/jpeg",
      multipart: true,
    }));
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/photos", expect.objectContaining({
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        categoryId: "album-1",
        title: "",
        caption: "",
        sortOrder: "",
        uploads: [
          { clientId: "0-first.jpg-1-1", url: "https://blob.example/1.jpg", pathname: "admin-images/1.jpg", fileName: "first.jpg", mimeType: "image/jpeg", size: 1 },
          { clientId: "1-second.jpg-1-2", url: "https://blob.example/2.jpg", pathname: "admin-images/2.jpg", fileName: "second.jpg", mimeType: "image/jpeg", size: 1 },
        ],
      }),
    }));
    expect(await screen.findByText("Photos saved.")).toBeTruthy();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("keeps successful uploads when some files fail and surfaces per-batch feedback", async () => {
    const fetchMock = vi.fn(async (url) => {
      return {
        ok: true,
        json: async () => ({ created: 1 }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    uploadMock.mockImplementation(async () => {
      const callIndex = uploadMock.mock.calls.length;
      if (callIndex === 2) {
        throw new Error("Image is too large");
      }

      return {
        url: `https://blob.example/${callIndex}.jpg`,
        pathname: `admin-images/${callIndex}.jpg`,
      };
    });

    const { container } = render(
      <AdminPhotoForm
        albumId="album-1"
        albumName="Random"
        createEndpoint="/api/admin/photos"
      />
    );

    const fileInput = container.querySelector('input[type="file"]');
    const first = new File(["a"], "first.jpg", { type: "image/jpeg", lastModified: 1 });
    const second = new File(["b"], "second.jpg", { type: "image/jpeg", lastModified: 2 });

    fireEvent.change(fileInput, { target: { files: [first, second] } });
    fireEvent.submit(container.querySelector("form"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/photos", expect.objectContaining({
        method: "POST",
      }));
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/photos", expect.objectContaining({
      body: JSON.stringify({
        categoryId: "album-1",
        title: "",
        caption: "",
        sortOrder: "",
        uploads: [
          { clientId: "0-first.jpg-1-1", url: "https://blob.example/1.jpg", pathname: "admin-images/1.jpg", fileName: "first.jpg", mimeType: "image/jpeg", size: 1 },
        ],
      }),
    }));
    expect(await screen.findByText(/1 张已保存，1 张失败/)).toBeTruthy();
    expect(await screen.findByText(/second.jpg.*Image is too large/)).toBeTruthy();
  });

  it("accepts mobile files with an empty MIME type when the image extension is supported", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ created: 1 }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    uploadMock.mockResolvedValue({
      url: "https://blob.example/mobile.jpg",
      pathname: "admin-images/mobile.jpg",
    });

    const { container } = render(
      <AdminPhotoForm
        albumId="album-1"
        albumName="Random"
        createEndpoint="/api/admin/photos"
      />
    );

    const fileInput = container.querySelector('input[type="file"]');
    const mobilePhoto = new File(["photo"], "IMG_0001.HEIC", { type: "", lastModified: 3 });

    fireEvent.change(fileInput, { target: { files: [mobilePhoto] } });
    fireEvent.submit(container.querySelector("form"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/photos", expect.objectContaining({
        method: "POST",
      }));
    });

    expect(uploadMock).toHaveBeenCalledWith(expect.stringContaining("img_0001.heic"), mobilePhoto, expect.objectContaining({
      contentType: "image/heic",
    }));
    expect(await screen.findByText("Photos saved.")).toBeTruthy();
  });
});
