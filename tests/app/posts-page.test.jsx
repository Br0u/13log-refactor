import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../../components/blog/PostPreviewCard", () => ({
  default: function PostPreviewCard({ post }) {
    return <article>{post.title}</article>;
  },
}));

vi.mock("../../lib/public-content", () => ({
  getPublicTimelineEntries: vi.fn(async () => (
    Array.from({ length: 13 }, (_, index) => ({
      slug: `post-${index + 1}`,
      title: `Post ${index + 1}`,
      type: "post",
      categories: ["Notes"],
      tags: ["Tag"],
    }))
  )),
}));

import PostsPage from "../../app/posts/page.jsx";

describe("posts index page", () => {
  it("renders pagination links when there are multiple pages", async () => {
    const element = await PostsPage({
      searchParams: Promise.resolve({}),
    });

    const markup = renderToStaticMarkup(element);

    expect(markup).toContain("/下一页");
    expect(markup).toContain("1 / 2");
  });
});
