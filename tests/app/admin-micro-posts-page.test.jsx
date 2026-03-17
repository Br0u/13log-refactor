import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../../app/admin/actions", () => ({
  createMicroPostAction: vi.fn(),
}));

vi.mock("../../lib/repositories/micro-posts", () => ({
  listMicroPosts: vi.fn(async () => ([
    {
      id: "micro-1",
      content: "今天很困，但还是想记一句。",
      status: "PUBLISHED",
      updatedAt: new Date("2026-03-15T10:00:00.000Z"),
      tags: [{ tag: { name: "碎碎念" } }],
    },
  ])),
}));

import AdminMicroPostsPage from "../../app/admin/(protected)/micro-posts/page.jsx";

describe("admin micro posts page", () => {
  it("renders the micro posts workspace with a create form and list", async () => {
    const markup = renderToStaticMarkup(await AdminMicroPostsPage());

    expect(markup).toContain("Micro posts");
    expect(markup).toContain('name="content"');
    expect(markup).not.toContain('name="publishedAt"');
    expect(markup).toContain("Publication time becomes editable after the micro post is published.");
    expect(markup).toContain(">Preview<");
    expect(markup).toContain("今天很困，但还是想记一句。");
    expect(markup).toContain("/admin/micro-posts/micro-1");
  });
});
