// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { refreshMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
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
      if (url === "/api/admin/uploads/image") {
        const callIndex = fetchMock.mock.calls.filter(([target]) => target === "/api/admin/uploads/image").length;
        return {
          ok: true,
          json: async () => ({
            url: `https://blob.example/${callIndex}.jpg`,
            pathname: `admin-images/${callIndex}.jpg`,
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({ created: 2 }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(
      <AdminPhotoForm
        albumId="album-1"
        albumName="Random"
        createEndpoint="/api/admin/photos"
      />
    );

    const fileInput = container.querySelector('input[type="file"]');
    const first = new File(["a"], "first.jpg", { type: "image/jpeg" });
    const second = new File(["b"], "second.jpg", { type: "image/jpeg" });

    fireEvent.change(fileInput, { target: { files: [first, second] } });
    fireEvent.submit(container.querySelector("form"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/photos", expect.objectContaining({
        method: "POST",
      }));
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/uploads/image", expect.objectContaining({
      method: "POST",
      body: expect.any(FormData),
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
          { url: "https://blob.example/1.jpg", pathname: "admin-images/1.jpg", fileName: "first.jpg" },
          { url: "https://blob.example/2.jpg", pathname: "admin-images/2.jpg", fileName: "second.jpg" },
        ],
      }),
    }));
    expect(await screen.findByText("Photos saved.")).toBeTruthy();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("keeps successful uploads when some files fail and surfaces per-batch feedback", async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url === "/api/admin/uploads/image") {
        const callIndex = fetchMock.mock.calls.filter(([target]) => target === "/api/admin/uploads/image").length;
        if (callIndex === 2) {
          return {
            ok: false,
            json: async () => ({ message: "Image is too large" }),
          };
        }

        return {
          ok: true,
          json: async () => ({
            url: `https://blob.example/${callIndex}.jpg`,
            pathname: `admin-images/${callIndex}.jpg`,
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({ created: 1 }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(
      <AdminPhotoForm
        albumId="album-1"
        albumName="Random"
        createEndpoint="/api/admin/photos"
      />
    );

    const fileInput = container.querySelector('input[type="file"]');
    const first = new File(["a"], "first.jpg", { type: "image/jpeg" });
    const second = new File(["b"], "second.jpg", { type: "image/jpeg" });

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
          { url: "https://blob.example/1.jpg", pathname: "admin-images/1.jpg", fileName: "first.jpg" },
        ],
      }),
    }));
    expect(await screen.findByText(/1 张已保存，1 张失败/)).toBeTruthy();
    expect(await screen.findByText(/second.jpg.*Image is too large/)).toBeTruthy();
  });
});
