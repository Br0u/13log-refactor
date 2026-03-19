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
  it("renders the posts page without traditional pagination controls", async () => {
    const element = await PostsPage({
      searchParams: Promise.resolve({}),
    });

    const markup = renderToStaticMarkup(element);

    expect(markup).not.toContain("/下一页");
    expect(markup).not.toContain("1 / 3");
    expect(markup).toContain('data-layout="posts-list"');
    expect(markup).toContain('href="/posts"');
    expect(markup).toContain('href="/posts?tag=Notes"');
  });

  it("renders the infinite timeline entrypoint with the first six cards", async () => {
    const element = await PostsPage({
      searchParams: Promise.resolve({}),
    });

    const markup = renderToStaticMarkup(element);

    expect(markup).toContain("Post 6");
    expect(markup).not.toContain("Post 7");
    expect(markup).toContain('data-testid="posts-timeline-sentinel"');
  });
});
