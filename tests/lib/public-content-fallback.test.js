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
  collectFilterCounts: vi.fn(),
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

import { getPublicPostBySlug, getPublicPosts, getPublicTimelineEntries } from "../../lib/public-content";

function createUnavailableDbError() {
  const error = new Error("Can't reach database server");
  error.code = "P1001";
  return error;
}

describe("public content database fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses file posts when the public posts database query cannot reach the database", async () => {
    getPublishedPostsMock.mockRejectedValueOnce(createUnavailableDbError());
    getFilePostsMock.mockReturnValueOnce([
      {
        slug: "file-post",
        title: "File Post",
        date: "2026-03-01T00:00:00.000Z",
        tags: ["fallback"],
        categories: [],
      },
    ]);

    const posts = await getPublicPosts();

    expect(posts).toMatchObject([
      {
        slug: "file-post",
        title: "File Post",
        status: "PUBLISHED",
        likeCount: 0,
        commentCount: 0,
      },
    ]);
  });

  it("falls back to the file post by slug when the database is unavailable", async () => {
    getPublishedPostBySlugMock.mockRejectedValueOnce(createUnavailableDbError());
    getFilePostBySlugMock.mockReturnValueOnce({
      slug: "file-post",
      title: "File Post",
      date: "2026-03-01T00:00:00.000Z",
    });

    const post = await getPublicPostBySlug("file-post");

    expect(post).toMatchObject({
      slug: "file-post",
      title: "File Post",
      status: "PUBLISHED",
      likeCount: 0,
      commentCount: 0,
    });
  });

  it("keeps the public timeline usable without database-backed micro posts", async () => {
    getPublishedPostsMock.mockRejectedValueOnce(createUnavailableDbError());
    getPublishedMicroPostsMock.mockRejectedValueOnce(createUnavailableDbError());
    getFilePostsMock.mockReturnValueOnce([
      {
        slug: "file-post",
        title: "File Post",
        date: "2026-03-01T00:00:00.000Z",
        tags: ["fallback"],
        categories: [],
      },
    ]);

    const entries = await getPublicTimelineEntries();

    expect(entries).toMatchObject([
      {
        slug: "file-post",
        title: "File Post",
        type: "post",
        href: "/posts/file-post",
      },
    ]);
  });
});
