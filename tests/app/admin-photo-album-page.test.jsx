import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const {
  authError,
  requireAdminSessionMock,
  formDataGetMock,
  getPhotoCategoryByIdMock,
  listPhotoCategoriesMock,
  updatePhotoCategoryMock,
  listAdminPhotosMock,
} = vi.hoisted(() => ({
  authError: new Error("ADMIN_SESSION_REQUIRED"),
  requireAdminSessionMock: vi.fn(),
  formDataGetMock: vi.fn(),
  getPhotoCategoryByIdMock: vi.fn(),
  listPhotoCategoriesMock: vi.fn(),
  updatePhotoCategoryMock: vi.fn(),
  listAdminPhotosMock: vi.fn(),
}));

vi.mock("../../lib/admin-session", () => ({
  requireAdminSession: requireAdminSessionMock,
}));

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
  getPhotoCategoryById: getPhotoCategoryByIdMock,
  listPhotoCategories: listPhotoCategoriesMock,
  updatePhotoCategory: updatePhotoCategoryMock,
}));

vi.mock("../../lib/repositories/photos", () => ({
  listAdminPhotos: listAdminPhotosMock,
}));

import AdminPhotoAlbumPage from "../../app/admin/(protected)/photos/[id]/page.jsx";

const CATEGORY = {
  id: "photo-cat-1",
  name: "Editorial",
  slug: "editorial",
  description: "A quiet album",
  albumAnnotation: "注释词",
  displayTitle: "「世界は　ただ通り過ぎていく」",
  coverTitle: "「世界は　ただ通り過ぎていく」",
  indexDescription: "車窗之外，世界剛好經過。\n沒有停留，也沒有帶走什麼。",
  detailDescription: "車窗之外，世界剛好經過。\n沒有停留，也沒有帶走什麼。",
};

function findAlbumUpdateForm(node) {
  if (!React.isValidElement(node)) {
    return null;
  }
  if (typeof node.props.action === "function" && node.props.submitLabel === "Update album") {
    return node;
  }

  let match = null;
  React.Children.forEach(node.props.children, (child) => {
    if (!match) {
      match = findAlbumUpdateForm(child);
    }
  });
  return match;
}

describe("admin photo album page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPhotoCategoryByIdMock.mockResolvedValue(CATEGORY);
    listPhotoCategoriesMock.mockResolvedValue([
      {
        id: "photo-cat-1",
        name: "Editorial",
        slug: "editorial",
      },
    ]);
    listAdminPhotosMock.mockImplementation(async ({ categoryId }) => [
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
    ]);
    requireAdminSessionMock.mockResolvedValue({ username: "admin" });
  });

  it("renders upload controls and the selected album's photos", async () => {
    const markup = renderToStaticMarkup(await AdminPhotoAlbumPage({
      params: Promise.resolve({ id: "photo-cat-1" }),
    }));

    expect(markup).toContain("Upload photo");
    expect(markup).toContain("Editorial");
    expect(markup).toContain("Edit album");
    expect(markup).toContain('name="albumAnnotation"');
    expect(markup).toContain('name="displayTitle"');
    expect(markup).toContain('name="coverTitle"');
    expect(markup).toContain('name="indexDescription"');
    expect(markup).toContain('name="detailDescription"');
    expect(markup).toContain("「世界は　ただ通り過ぎていく」");
    expect(markup).toContain("Morning light in photo-cat-1");
    expect(markup).not.toContain("Select album");
    expect(markup).toContain("Leave title empty to reuse each file name during batch upload.");
    expect(markup).toContain("Mobile HEIC/HEIF files are accepted.");
    expect(markup).toContain("admin-photo-grid");
    expect(markup).toContain('href="/admin/photos/album/photo-cat-1/photo-1"');
    expect(markup).toContain("Edit");
    expect(markup).toContain("Delete photo");
  });

  it("falls back to legacy album copy when the database fields are still empty", async () => {
    getPhotoCategoryByIdMock.mockResolvedValueOnce({
      id: "photo-cat-1",
      name: "Car",
      slug: "car",
      description: "A quiet album",
      albumAnnotation: "",
      displayTitle: "",
      coverTitle: "",
      indexDescription: "",
      detailDescription: "",
    });

    const markup = renderToStaticMarkup(await AdminPhotoAlbumPage({
      params: Promise.resolve({ id: "photo-cat-1" }),
    }));

    expect(markup).toContain('value="世界は　ただ通り過ぎていく"');
    expect(markup).toContain(">車窗之外，世界剛好經過。\n沒有停留，也沒有帶走什麼。</textarea>");
  });

  it("authenticates album updates before parsing or repository writes", async () => {
    const tree = await AdminPhotoAlbumPage({
      params: Promise.resolve({ id: "photo-cat-1" }),
    });
    const updateForm = findAlbumUpdateForm(tree);

    expect(updateForm).not.toBeNull();

    vi.clearAllMocks();
    requireAdminSessionMock.mockRejectedValue(authError);
    const formData = { get: formDataGetMock };

    await expect(updateForm.props.action({}, formData)).rejects.toBe(authError);

    expect(requireAdminSessionMock).toHaveBeenCalledOnce();
    expect(formDataGetMock).not.toHaveBeenCalled();
    expect(updatePhotoCategoryMock).not.toHaveBeenCalled();
  });
});
