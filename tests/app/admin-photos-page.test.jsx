import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../../lib/repositories/photo-categories", () => ({
  listPhotoCategories: vi.fn(async () => [
    {
      id: "photo-cat-1",
      name: "Editorial",
      slug: "editorial",
      description: "A quiet album",
      status: "PUBLISHED",
      sortOrder: 1,
    },
  ]),
}));

import AdminPhotosPage from "../../app/admin/(protected)/photos/page.jsx";

describe("admin photos page", () => {
  it("renders the album manager instead of a mixed upload dashboard", async () => {
    const markup = renderToStaticMarkup(await AdminPhotosPage());

    expect(markup).toContain("Photos");
    expect(markup).toContain("Save category");
    expect(markup).toContain("Editorial");
    expect(markup).toContain("A quiet album");
    expect(markup).toContain("PUBLISHED");
    expect(markup).toContain('href="/admin/photos/photo-cat-1"');
    expect(markup).toContain('name="status"');
    expect(markup).not.toContain('class="admin-secondary-link">Save</button>');
    expect(markup).not.toContain("Upload photo");
    expect(markup).not.toContain("admin-photo-grid");
  });
});
