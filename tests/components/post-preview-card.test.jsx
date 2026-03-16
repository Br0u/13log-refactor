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
  });

  it("renders micro posts without a detail link or title heading", () => {
    const markup = renderToStaticMarkup(
      <PostPreviewCard
        post={{
          type: "micro",
          id: "micro-1",
          content: "今天风很大，脑子也很乱。",
          summary: "今天风很大，脑子也很乱。",
          date: "2026-03-15T10:48:33.000Z",
          tags: ["碎碎念"],
          categories: [],
        }}
      />
    );

    expect(markup).toContain("今天风很大，脑子也很乱。");
    expect(markup).toContain("碎碎念");
    expect(markup).not.toContain("post-preview-card__title");
    expect(markup).not.toContain("entry-link");
    expect(markup).toContain("post-preview-card__micro-calendar");
    expect(markup).toContain("post-preview-card__micro-clock");
    expect(markup).toContain("post-preview-card__micro-month");
    expect(markup).toContain("post-preview-card__micro-day");
    expect(markup).toContain("post-preview-card__micro-year");
    expect(markup).toContain("post-preview-card__micro-time");
  });
});
