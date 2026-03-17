import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../../app/admin/actions", () => ({
  deletePostAction: vi.fn(),
  updatePostAction: vi.fn(),
}));

vi.mock("../../lib/repositories/categories", () => ({
  listCategories: vi.fn(async () => [{ id: "cat-1", name: "Notes" }]),
}));

vi.mock("../../lib/db", () => ({
  db: {
    post: {
      findUnique: vi.fn(async () => ({
        id: "post-1",
        title: "Example Post",
        slug: "example-post",
        summary: "Summary",
        markdown: "Body",
        coverImage: "",
        status: "DRAFT",
        publishedAt: null,
        categoryId: "cat-1",
        tags: [],
      })),
    },
  },
}));

import AdminEditPostPage from "../../app/admin/(protected)/posts/[id]/page.jsx";

describe("admin edit post page", () => {
  it("renders a saved notice when redirected from new post creation", async () => {
    const markup = renderToStaticMarkup(await AdminEditPostPage({
      params: Promise.resolve({ id: "post-1" }),
      searchParams: Promise.resolve({ created: "1" }),
    }));

    expect(markup).toContain("Post saved.");
  });
});
