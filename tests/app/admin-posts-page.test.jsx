import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../../lib/db", () => ({
  db: {
    post: {
      findMany: vi.fn(async () => ([
        {
          id: "post-1",
          title: "A post",
          status: "PUBLISHED",
          updatedAt: new Date("2026-03-15T10:00:00.000Z"),
          category: { name: "Notes" },
        },
      ])),
    },
  },
}));

import AdminPostsPage from "../../app/admin/posts/page.jsx";

describe("admin posts page", () => {
  it("renders an editorial page header and content panel", async () => {
    const markup = renderToStaticMarkup(await AdminPostsPage());

    expect(markup).toContain("admin-page-header");
    expect(markup).toContain("admin-page__panel");
    expect(markup).toContain("admin-table admin-panel-table");
    expect(markup).toContain("New post");
  });
});
