import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getFilePostBySlugMock,
  getFilePostsMock,
  getPublishedMicroPostsMock,
  getPublishedPostBySlugMock,
  getPublishedPostsMock,
} = vi.hoisted(() => ({
  getFilePostBySlugMock: vi.fn(),
  getFilePostsMock: vi.fn(),
  getPublishedMicroPostsMock: vi.fn(),
  getPublishedPostBySlugMock: vi.fn(),
  getPublishedPostsMock: vi.fn(),
}));

vi.mock("../../lib/content", async () => ({
  ...(await vi.importActual("../../lib/content")),
  getPostBySlug: getFilePostBySlugMock,
  getPosts: getFilePostsMock,
}));

vi.mock("../../lib/repositories/posts", () => ({
  getPublishedPostBySlug: getPublishedPostBySlugMock,
  getPublishedPosts: getPublishedPostsMock,
}));

vi.mock("../../lib/repositories/micro-posts", () => ({
  getPublishedMicroPosts: getPublishedMicroPostsMock,
}));

import * as publicContent from "../../lib/public-content";
import * as markdown from "../../lib/markdown";
import { collectFilterCounts } from "../../lib/content";

describe("public timeline facade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes a mixed timeline query for posts and micro posts", () => {
    expect(typeof publicContent.getPublicTimelineEntries).toBe("function");
    expect(typeof publicContent.getPublicPostsPageData).toBe("function");
  });

  it("loads page data once and renders rich html only for the selected feed", async () => {
    getPublishedPostsMock.mockResolvedValue([
      {
        id: "post-match",
        slug: "post-match",
        title: "Matching post",
        markdown: "Matching post",
        summary: "Matching post",
        status: "PUBLISHED",
        publishedAt: new Date("2026-08-01T00:00:00.000Z"),
        category: { name: "match" },
        tags: [{ tag: { name: "shared" } }],
        likeCount: 0,
        commentCount: 0,
      },
      {
        id: "post-other",
        slug: "post-other",
        title: "Other post",
        markdown: "Other post",
        summary: "Other post",
        status: "PUBLISHED",
        publishedAt: new Date("2026-07-31T00:00:00.000Z"),
        category: { name: "other" },
        tags: [],
        likeCount: 0,
        commentCount: 0,
      },
    ]);
    getPublishedMicroPostsMock.mockResolvedValue([
      {
        id: "micro-match",
        content: "匹配内容\n\n- 列表项",
        status: "PUBLISHED",
        publishedAt: new Date("2026-08-01T01:00:00.000Z"),
        tags: [{ tag: { name: "match" } }],
        likeCount: 0,
      },
      {
        id: "micro-other",
        content: "不匹配内容\n\n- 列表项",
        status: "PUBLISHED",
        publishedAt: new Date("2026-08-01T02:00:00.000Z"),
        tags: [{ tag: { name: "other" } }],
        likeCount: 0,
      },
    ]);
    const renderSpy = vi.spyOn(markdown, "renderMicroMarkdownToHtml");

    const pageData = await publicContent.getPublicPostsPageData({ tag: "match" });

    expect(getPublishedPostsMock).toHaveBeenCalledTimes(1);
    expect(getPublishedMicroPostsMock).toHaveBeenCalledTimes(1);
    expect(pageData.allEntries.map((entry) => entry.id)).toEqual([
      "micro-other",
      "micro-match",
      "post-match",
      "post-other",
    ]);
    expect(pageData.allEntries.filter((entry) => entry.type === "micro").every((entry) => entry.renderedContentHtml === "")).toBe(true);
    expect(pageData.filteredEntries.map((entry) => entry.id)).toEqual(["micro-match", "post-match"]);
    expect(pageData.filteredEntries.find((entry) => entry.id === "micro-match")?.renderedContentHtml).toContain("<ul>");
    expect(renderSpy.mock.calls.some(([source]) => String(source).includes("不匹配内容"))).toBe(false);
    expect(renderSpy.mock.calls.some(([source]) => String(source).includes("匹配内容"))).toBe(true);

    renderSpy.mockRestore();
  });

  it("includes post categories and micro tags in de-duplicated filter counts", async () => {
    getPublishedPostsMock.mockResolvedValue([
      {
        id: "post-with-filters",
        slug: "post-with-filters",
        title: "Filter post",
        markdown: "Filter post",
        summary: "Filter post",
        status: "PUBLISHED",
        publishedAt: new Date("2026-08-01T00:00:00.000Z"),
        category: { name: "Category" },
        tags: [{ tag: { name: "Category" } }, { tag: { name: "Tag" } }],
        likeCount: 0,
        commentCount: 0,
      },
    ]);
    getPublishedMicroPostsMock.mockResolvedValue([
      {
        id: "micro-with-filter",
        content: "Filter micro",
        status: "PUBLISHED",
        publishedAt: new Date("2026-07-31T00:00:00.000Z"),
        tags: [{ tag: { name: "Tag" } }],
        likeCount: 0,
      },
    ]);

    const pageData = await publicContent.getPublicPostsPageData();

    expect(collectFilterCounts(pageData.allEntries)).toEqual([
      { tag: "Category", count: 1 },
      { tag: "Tag", count: 2 },
    ]);
  });

  it("preserves a text micropost's single line break for the public card", async () => {
    getPublishedPostsMock.mockResolvedValue([
      {
        id: "post-1",
        slug: "post-1",
        title: "A post",
        markdown: "A post",
        summary: "A post",
        status: "PUBLISHED",
        publishedAt: new Date("2026-08-01T00:00:00.000Z"),
        category: null,
        tags: [],
        likeCount: 0,
        commentCount: 0,
      },
    ]);
    getPublishedMicroPostsMock.mockResolvedValue([
      {
        id: "micro-with-line-break",
        content: "第一行\n第二行",
        status: "PUBLISHED",
        publishedAt: new Date("2026-08-01T01:00:00.000Z"),
        tags: [],
        likeCount: 0,
      },
    ]);

    const entries = await publicContent.getPublicTimelineEntries();
    const microPost = entries.find((entry) => entry.id === "micro-with-line-break");

    expect(microPost?.renderedContentHtml).toContain("第一行<br>");
    expect(microPost?.renderedContentHtml).toContain("第二行");
  });

  it("keeps the full text of long microposts in the public card payload", async () => {
    const content = "长内容".repeat(100);
    getPublishedPostsMock.mockResolvedValue([]);
    getFilePostsMock.mockReturnValue([]);
    getPublishedMicroPostsMock.mockResolvedValue([
      {
        id: "micro-long-text",
        content,
        status: "PUBLISHED",
        publishedAt: new Date("2026-09-02T06:12:00.000Z"),
        tags: [],
        likeCount: 0,
      },
    ]);

    const entries = await publicContent.getPublicTimelineEntries();

    expect(entries[0].summary).toBe(content);
  });
});
