import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { getPublicTimelineEntriesMock } = vi.hoisted(() => ({
  getPublicTimelineEntriesMock: vi.fn(async () => (
    Array.from({ length: 13 }, (_, index) => ({
      slug: `post-${index + 1}`,
      title: `Post ${index + 1}`,
      type: "post",
      categories: ["Notes"],
      tags: ["Tag"],
    }))
  )),
}));

vi.mock("../../components/blog/PostPreviewCard", () => ({
  default: function PostPreviewCard({ post }) {
    return <article>{post.title}</article>;
  },
}));

vi.mock("../../lib/public-content", () => ({
  getPublicTimelineEntries: getPublicTimelineEntriesMock,
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
    expect(markup).toContain("blog-layout blog-layout--posts-index");
    expect(markup).toContain("blog-rail");
    expect(markup.indexOf(">/ posts<")).toBeLessThan(markup.indexOf(">/ about<"));
    expect(markup).toContain('href="/about"');
    expect(markup).toContain(">/ about<");
    expect(markup).toContain('href="/posts"');
    expect(markup).toContain(">/ posts<");
    expect(markup).toContain('href="/link"');
    expect(markup).not.toContain("/rss.xml");
    expect(markup).toContain(">前言<");
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

  it("uses a lightweight timeline pass for filter chips before loading the active tag feed", async () => {
    getPublicTimelineEntriesMock.mockClear();

    await PostsPage({
      searchParams: Promise.resolve({ tag: "Tag" }),
    });

    expect(getPublicTimelineEntriesMock).toHaveBeenNthCalledWith(1, { renderMicroHtml: false });
    expect(getPublicTimelineEntriesMock).toHaveBeenNthCalledWith(2, { tag: "Tag" });
  });
});
