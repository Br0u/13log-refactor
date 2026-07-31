import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PostPreviewCard from "../../components/blog/PostPreviewCard";

describe("PostPreviewCard", () => {
  it("renders a quieter editorial card structure with a single summary block", () => {
    const markup = renderToStaticMarkup(
      <PostPreviewCard
        post={{
          type: "post",
          slug: "daily-note",
          urlSlug: "daily-note",
          title: "日寄 二十八",
          date: "2026-01-16T10:48:33.000Z",
          categories: ["日寄"],
          tags: ["碎笔记"],
          content: "故障灯亮了说明故障灯是好的。\n\n---\n\n《醒了还是没睡II》\n\n---\n\n其实我不是很懂为什么我爸妈要对我家狗狗说普通话而不是方言？\n\n---\n\n以前每次剪完指甲，磨边的时候都会想起骨粉。",
        }}
      />
    );

    expect(markup).toContain("日寄 二十八");
    expect(markup).toContain("2026");
    expect(markup).toContain("日寄");
    expect(markup).toContain("post-preview-card__header-meta");
    expect(markup).toContain("故障灯亮了说明故障灯是好的。");
    expect(markup).toContain("post-preview-card__excerpt-block");
    expect(markup).not.toContain("post-preview-card__separator");
    expect(markup).not.toContain("[展开全文]");
    expect(markup).not.toContain("data-post-tags");
  });

  it("preserves meaningful hyphens in normalized post summaries", () => {
    const markup = renderToStaticMarkup(
      <PostPreviewCard
        post={{
          type: "post",
          slug: "hyphen-note",
          urlSlug: "hyphen-note",
          title: "连字符测试",
          summary: "AI-generated notes about e-mail habits",
          categories: ["日寄"],
          tags: ["碎笔记"],
        }}
      />
    );

    expect(markup).toContain("AI-generated notes about e-mail habits");
  });

  it("renders micro posts without a detail link or title heading", () => {
    const markup = renderToStaticMarkup(
      <PostPreviewCard
        post={{
          type: "micro",
          id: "micro-1",
          content: "今天风很大，脑子也很乱。",
          summary: "今天风很大，脑子也很乱。",
          renderedContentHtml: "<p>第一行<br>\n第二行</p><ul><li><strong>重点</strong></li></ul>",
          date: "2026-03-15T10:48:33.000Z",
          tags: ["碎碎念"],
          categories: [],
        }}
      />
    );

    expect(markup).toContain("<br>");
    expect(markup).toContain("<strong>重点</strong>");
    expect(markup).not.toContain("post-preview-card__title");
    expect(markup).not.toContain("entry-link");
    expect(markup).toContain("post-preview-card__micro-calendar");
    expect(markup).toContain("post-preview-card__micro-clock");
    expect(markup).toContain("post-preview-card__micro-month");
    expect(markup).toContain("post-preview-card__micro-day");
    expect(markup).toContain("post-preview-card__micro-year");
    expect(markup).toContain("post-preview-card__micro-time");
    expect(markup).toContain("post-preview-card__micro-richtext");
  });

  it("renders micropost images with the shared framed image class", () => {
    const markup = renderToStaticMarkup(
      <PostPreviewCard
        post={{
          type: "micro",
          id: "micro-2",
          content: "带图的 micro post",
          summary: "带图的 micro post",
          renderedContentHtml: "<p><img src=\"/test.jpg\" alt=\"test\"></p>",
          date: "2026-03-15T10:48:33.000Z",
          tags: ["碎碎念"],
          categories: [],
        }}
      />
    );

    expect(markup).toContain("post-preview-card__micro-image");
  });

  it("appends the shared image class to micropost images with existing classes", () => {
    const markup = renderToStaticMarkup(
      <PostPreviewCard
        post={{
          type: "micro",
          id: "micro-2b",
          content: "带图的 micro post",
          summary: "带图的 micro post",
          renderedContentHtml: "<p><img src='/test.jpg' alt='test' class='existing-frame'></p>",
          date: "2026-03-15T10:48:33.000Z",
          tags: ["碎碎念"],
          categories: [],
        }}
      />
    );

    expect(markup).toContain("existing-frame post-preview-card__micro-image");
  });

  it("does not duplicate the shared image class when micropost markup already has it", () => {
    const markup = renderToStaticMarkup(
      <PostPreviewCard
        post={{
          type: "micro",
          id: "micro-2c",
          content: "带图的 micro post",
          summary: "带图的 micro post",
          renderedContentHtml: "<p><img src=\"/test.jpg\" alt=\"test\" class=\"post-preview-card__micro-image existing-frame\"></p>",
          date: "2026-03-15T10:48:33.000Z",
          tags: ["碎碎念"],
          categories: [],
        }}
      />
    );

    expect(markup).toContain("post-preview-card__micro-image existing-frame");
    expect(markup).not.toContain("post-preview-card__micro-image post-preview-card__micro-image");
  });

  it("marks microposts containing a duo image layout for unclipped paired rendering", () => {
    const markup = renderToStaticMarkup(
      <PostPreviewCard
        post={{
          type: "micro",
          id: "micro-duo",
          content: "双图 micro post",
          summary: "双图 micro post",
          renderedContentHtml: "<div class=\"post-figure-pair\"><figure class=\"post-figure post-figure--paired\"><img src=\"/left.jpg\" alt=\"left\"></figure><figure class=\"post-figure post-figure--paired\"><img src=\"/right.jpg\" alt=\"right\"></figure></div>",
          date: "2026-07-31T03:20:00.000Z",
          tags: [],
          categories: [],
        }}
      />
    );

    expect(markup).toContain("post-preview-card--micro-paired");
  });

  it("uses native scrolling instead of rendering a custom micropost scroll range", () => {
    const markup = renderToStaticMarkup(
      <PostPreviewCard
        post={{
          type: "micro",
          id: "micro-3",
          content: "可滚动 micro post",
          summary: "可滚动 micro post",
          renderedContentHtml: "<p>第一段</p><p>第二段</p>",
          date: "2026-03-15T10:48:33.000Z",
          tags: ["碎碎念"],
          categories: [],
        }}
        microScrollChrome={{
          isScrollable: true,
          progress: 0.4,
          viewportRatio: 0.28,
        }}
      />
    );

    expect(markup).not.toContain("post-preview-card__micro-scroll-range");
    expect(markup).not.toContain("post-preview-card__micro-scroll-thumb");
    expect(markup).not.toContain("--micro-scroll-progress");
    expect(markup).not.toContain("--micro-scroll-window");
  });

  it("renders a micropost heart like button with the current count", () => {
    const markup = renderToStaticMarkup(
      <PostPreviewCard
        post={{
          type: "micro",
          id: "micro-4",
          content: "可点赞 micro post",
          summary: "可点赞 micro post",
          renderedContentHtml: "<p>第一段</p>",
          date: "2026-03-15T10:48:33.000Z",
          tags: ["碎碎念"],
          categories: [],
          likeCount: 3,
        }}
      />
    );

    expect(markup).toContain("micro-post-like-button");
    expect(markup).toContain("♡");
    expect(markup).toContain(">3<");
  });
});
