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

vi.mock("../../lib/repositories/photo-categories", () => ({
  getPhotoCategoryById: vi.fn(async () => ({
    id: "photo-cat-1",
    name: "Editorial",
    slug: "editorial",
    description: "A quiet album",
    displayTitle: "「世界は　ただ通り過ぎていく」",
    coverTitle: "「世界は　ただ通り過ぎていく」",
    indexDescription: "車窗之外，世界剛好經過。\n沒有停留，也沒有帶走什麼。",
    detailDescription: "車窗之外，世界剛好經過。\n沒有停留，也沒有帶走什麼。",
  })),
  listPhotoCategories: vi.fn(async () => [
    {
      id: "photo-cat-1",
      name: "Editorial",
      slug: "editorial",
    },
  ]),
}));

vi.mock("../../lib/repositories/photos", () => ({
  listAdminPhotos: vi.fn(async ({ categoryId }) => [
    {
      id: "photo-1",
      title: `Morning light in ${categoryId}`,
      caption: "Soft stone",
      imageUrl: "/photos/morning-light.jpg",
      status: "PUBLISHED",
      sortOrder: 3,
      category: {
        id: "photo-cat-1",
        name: "Editorial",
      },
    },
  ]),
}));

import AdminPhotoAlbumPage from "../../app/admin/(protected)/photos/[id]/page.jsx";

describe("admin photo album page", () => {
  it("renders upload controls and the selected album's photos", async () => {
    const markup = renderToStaticMarkup(await AdminPhotoAlbumPage({
      params: Promise.resolve({ id: "photo-cat-1" }),
    }));

    expect(markup).toContain("Upload photo");
    expect(markup).toContain("Editorial");
    expect(markup).toContain("Edit album");
    expect(markup).toContain('name="displayTitle"');
    expect(markup).toContain('name="coverTitle"');
    expect(markup).toContain('name="indexDescription"');
    expect(markup).toContain('name="detailDescription"');
    expect(markup).toContain("「世界は　ただ通り過ぎていく」");
    expect(markup).toContain("Morning light in photo-cat-1");
    expect(markup).not.toContain("Select album");
    expect(markup).toContain("Leave title empty to reuse each file name during batch upload.");
    expect(markup).toContain("admin-photo-grid");
    expect(markup).toContain('href="/admin/photos/album/photo-cat-1/photo-1"');
    expect(markup).toContain("Edit");
    expect(markup).toContain("Delete photo");
  });
});
