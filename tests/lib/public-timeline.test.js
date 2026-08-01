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

vi.mock("../../lib/content", () => ({
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

describe("public timeline facade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes a mixed timeline query for posts and micro posts", () => {
    expect(typeof publicContent.getPublicTimelineEntries).toBe("function");
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
});
