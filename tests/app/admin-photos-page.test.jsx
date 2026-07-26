import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const {
  authError,
  requireAdminSessionMock,
  formDataGetMock,
  createPhotoCategoryMock,
  getPhotoCategoryByIdMock,
  listPhotoCategoriesMock,
  updatePhotoCategoryMock,
} = vi.hoisted(() => ({
  authError: new Error("ADMIN_SESSION_REQUIRED"),
  requireAdminSessionMock: vi.fn(),
  formDataGetMock: vi.fn(),
  createPhotoCategoryMock: vi.fn(),
  getPhotoCategoryByIdMock: vi.fn(),
  listPhotoCategoriesMock: vi.fn(),
  updatePhotoCategoryMock: vi.fn(),
}));

vi.mock("../../lib/admin-session", () => ({
  requireAdminSession: requireAdminSessionMock,
}));

vi.mock("../../lib/repositories/photo-categories", () => ({
  createPhotoCategory: createPhotoCategoryMock,
  getPhotoCategoryById: getPhotoCategoryByIdMock,
  listPhotoCategories: listPhotoCategoriesMock,
  updatePhotoCategory: updatePhotoCategoryMock,
}));

import AdminPhotosPage from "../../app/admin/(protected)/photos/page.jsx";

const CATEGORY = {
  id: "photo-cat-1",
  name: "Editorial",
  slug: "editorial",
  description: "A quiet album",
  status: "PUBLISHED",
  sortOrder: 1,
};

function findActionElement(node, predicate) {
  if (!React.isValidElement(node)) {
    return null;
  }
  if (typeof node.props.action === "function" && predicate(node)) {
    return node;
  }

  let match = null;
  React.Children.forEach(node.props.children, (child) => {
    if (!match) {
      match = findActionElement(child, predicate);
    }
  });
  return match;
}

describe("admin photos page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listPhotoCategoriesMock.mockResolvedValue([CATEGORY]);
    requireAdminSessionMock.mockResolvedValue({ username: "admin" });
  });

  it("renders the album manager instead of a mixed upload dashboard", async () => {
    const markup = renderToStaticMarkup(await AdminPhotosPage());

    expect(markup).toContain("Photos");
    expect(markup).toContain("Save category");
    expect(markup).toContain("Editorial");
    expect(markup).toContain("A quiet album");
    expect(markup).toContain("PUBLISHED");
    expect(markup).toContain('name="name"');
    expect(markup).toContain('name="slug"');
    expect(markup).toContain('name="status"');
    expect(markup).not.toContain('name="displayTitle"');
    expect(markup).not.toContain('name="coverTitle"');
    expect(markup).not.toContain('name="albumAnnotation"');
    expect(markup).toContain('href="/admin/photos/photo-cat-1"');
    expect(markup).toContain('name="status"');
    expect(markup).not.toContain('class="admin-secondary-link">Save</button>');
    expect(markup).not.toContain("Upload photo");
    expect(markup).not.toContain("admin-photo-grid");
  });

  it("authenticates quick-create and status mutations before photo-category access", async () => {
    const tree = await AdminPhotosPage();
    const quickCreateForm = findActionElement(
      tree,
      (element) => element.props.mode === "quick-create"
    );
    const statusForm = findActionElement(
      tree,
      (element) => element.props.className === "admin-inline-form admin-inline-form--status"
    );

    expect(quickCreateForm).not.toBeNull();
    expect(statusForm).not.toBeNull();

    vi.clearAllMocks();
    requireAdminSessionMock.mockRejectedValue(authError);
    const formData = { get: formDataGetMock };

    await expect(quickCreateForm.props.action({}, formData)).rejects.toBe(authError);
    await expect(statusForm.props.action(formData)).rejects.toBe(authError);

    expect(requireAdminSessionMock).toHaveBeenCalledTimes(2);
    expect(formDataGetMock).not.toHaveBeenCalled();
    expect(createPhotoCategoryMock).not.toHaveBeenCalled();
    expect(getPhotoCategoryByIdMock).not.toHaveBeenCalled();
    expect(listPhotoCategoriesMock).not.toHaveBeenCalled();
    expect(updatePhotoCategoryMock).not.toHaveBeenCalled();
  });
});
