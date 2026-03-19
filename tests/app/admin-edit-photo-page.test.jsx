import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      refresh: vi.fn(),
    }),
  };
});

vi.mock("../../app/admin/actions", () => ({
  deletePhotoAction: vi.fn(),
  updatePhotoAction: vi.fn(),
}));

vi.mock("../../lib/repositories/photo-categories", () => ({
  getPhotoCategoryById: vi.fn(async () => ({
    id: "photo-cat-1",
    name: "Editorial",
    slug: "editorial",
    status: "PUBLISHED",
  })),
  listPhotoCategories: vi.fn(async () => [{ id: "photo-cat-1", name: "Editorial", slug: "editorial", status: "PUBLISHED" }]),
}));

vi.mock("../../lib/repositories/photos", () => ({
  getPhotoById: vi.fn(async () => ({
    id: "photo-1",
    title: "Morning Light",
    caption: "Quiet stone",
    imageUrl: "/images/gallery/example.jpg",
    sortOrder: 4,
    categoryId: "photo-cat-1",
    category: {
      id: "photo-cat-1",
      name: "Editorial",
    },
  })),
}));

import AdminEditPhotoPage from "../../app/admin/(protected)/photos/album/[albumId]/[photoId]/page.jsx";

describe("admin edit photo page", () => {
  it("renders the photo edit form and danger zone for the selected album photo", async () => {
    const markup = renderToStaticMarkup(await AdminEditPhotoPage({
      params: Promise.resolve({ albumId: "photo-cat-1", photoId: "photo-1" }),
      searchParams: Promise.resolve({ created: "1" }),
    }));

    expect(markup).toContain("Edit Photo");
    expect(markup).toContain("Photo saved.");
    expect(markup).toContain('value="Morning Light"');
    expect(markup).toContain("Quiet stone");
    expect(markup).toContain('value="4"');
    expect(markup).toContain('value="Editorial"');
    expect(markup).not.toContain('name="status"');
    expect(markup).not.toContain('name="publishedAt"');
    expect(markup).toContain("Delete photo");
  });
});
