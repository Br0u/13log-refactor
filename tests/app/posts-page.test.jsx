import React from "react";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { getPublicPostsPageDataMock } = vi.hoisted(() => ({
  getPublicPostsPageDataMock: vi.fn(async () => {
    const entries = Array.from({ length: 13 }, (_, index) => ({
      slug: `post-${index + 1}`,
      title: `Post ${index + 1}`,
      type: "post",
      categories: ["Notes"],
      tags: ["Tag"],
    }));
    return {
      allEntries: entries,
      filteredEntries: entries,
    };
  }),
}));

vi.mock("../../components/blog/PostPreviewCard", () => ({
  default: function PostPreviewCard({ post }) {
    return <article>{post.title}</article>;
  },
}));

vi.mock("../../lib/public-content", () => ({
  getPublicPostsPageData: getPublicPostsPageDataMock,
}));

import PostsPage from "../../app/posts/page.jsx";

describe("posts index page", () => {
  it("uses the dedicated ink background for post pages", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toContain("body:has(.blog-layout--posts-index),\nbody:has(.blog-layout--post-detail)");
    expect(stylesheet).toContain("body.dark:has(.blog-layout--posts-index),\nbody.dark:has(.blog-layout--post-detail)");
    expect(stylesheet).toContain('image-set(url("/images/backgrounds/posts-ink-bg.webp") type("image/webp"), url("/images/backgrounds/posts-ink-bg.png") type("image/png")) center / cover no-repeat fixed');
    expect(stylesheet).toContain('image-set(url("/images/backgrounds/posts-night-ink-bg.webp") type("image/webp"), url("/images/backgrounds/posts-night-ink-bg.png") type("image/png")) center / cover no-repeat fixed');
    expect(stylesheet).toContain('background: image-set(url("/images/backgrounds/posts-ink-bg.webp") type("image/webp"), url("/images/backgrounds/posts-ink-bg.png") type("image/png")) center / cover no-repeat;');
    expect(stylesheet).toContain('image-set(url("/images/backgrounds/posts-mobile-night-ink-bg.webp") type("image/webp"), url("/images/backgrounds/posts-mobile-night-ink-bg.png") type("image/png")) center top / cover no-repeat');
  });

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
    expect(markup.indexOf(">/ POSTS<")).toBeLessThan(markup.indexOf(">/ ABOUT<"));
    expect(markup).toContain('href="/about"');
    expect(markup).toContain(">/ ABOUT<");
    expect(markup).toContain('href="/posts"');
    expect(markup).toContain(">/ POSTS<");
    expect(markup).toContain('href="/link"');
    expect(markup).not.toContain("/rss.xml");
    expect(markup).toContain("<span>你，</span><span>一会看我，</span><span>一会看云。</span><span>我觉得你看我时很远，</span><span>你看云时很近。</span>");
    expect(markup).toContain("blog-rail__intro-card");
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

  it("loads filter chips and the active tag feed through one page facade call", async () => {
    getPublicPostsPageDataMock.mockClear();

    await PostsPage({
      searchParams: Promise.resolve({ tag: "Tag" }),
    });

    expect(getPublicPostsPageDataMock).toHaveBeenCalledTimes(1);
    expect(getPublicPostsPageDataMock).toHaveBeenCalledWith({ tag: "Tag" });
  });
});
