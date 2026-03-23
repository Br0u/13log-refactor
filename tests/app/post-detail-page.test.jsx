import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../../app/components/HtmlContent.jsx", () => ({
  default: function HtmlContent({ html, className }) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  },
}));

vi.mock("../../components/blog/PostComments", () => ({
  default: function PostComments() {
    return <div>comments</div>;
  },
}));

vi.mock("../../components/blog/PostLikeButton", () => ({
  default: function PostLikeButton() {
    return <div>likes</div>;
  },
}));

vi.mock("../../lib/content", () => ({
  buildTocHtml: () => "",
  formatPostMeta: () => "2026-03-15 | Notes",
  renderMarkdown: vi.fn(async () => "<p>Body copy.</p>"),
  withHeadingAnchors: (html) => html,
}));

vi.mock("../../lib/public-content", () => ({
  getPublicPostBySlug: vi.fn(async () => ({
    slug: "example-post",
    title: "Example Post",
    content: "Body copy.",
    tags: ["notes"],
    likeCount: 0,
  })),
  getPublicPosts: vi.fn(async () => [
    {
      slug: "another-post",
      title: "Another Post",
      urlSlug: "another-post",
      tags: ["notes"],
      date: "2026-03-16",
    },
  ]),
}));

vi.mock("../../lib/repositories/comments", () => ({
  getApprovedCommentsBySlug: vi.fn(async () => []),
}));

import PostDetailPage from "../../app/posts/[slug]/page";

describe("post detail page", () => {
  it("renders the post detail with the blended layout class", async () => {
    const element = await PostDetailPage({
      params: Promise.resolve({ slug: "example-post" }),
    });
    const markup = renderToStaticMarkup(element);

    expect(markup).toContain("post-single post-single--blended");
    expect(markup).toContain("blog-layout blog-layout--post-detail");
    expect(markup).toContain("blog-rail blog-rail--detail");
    expect(markup).toContain("返回 Posts");
    expect(markup).toContain("Example Post");
    expect(markup).toContain("相关文章");
    expect(markup.indexOf("blog-rail blog-rail--detail")).toBeLessThan(markup.indexOf("post-single post-single--blended"));
  });
});
