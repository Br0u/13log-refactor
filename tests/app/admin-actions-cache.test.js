import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  revalidatePathMock,
  createPostMock,
  updatePostMock,
  createMicroPostMock,
  updateMicroPostMock,
  approveCommentMock,
  removeCommentMock,
  approveGuestbookEntryMock,
  removeGuestbookEntryMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  createPostMock: vi.fn(),
  updatePostMock: vi.fn(),
  createMicroPostMock: vi.fn(),
  updateMicroPostMock: vi.fn(),
  approveCommentMock: vi.fn(),
  removeCommentMock: vi.fn(),
  approveGuestbookEntryMock: vi.fn(),
  removeGuestbookEntryMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("../../lib/repositories/posts", () => ({
  createPost: createPostMock,
  updatePost: updatePostMock,
}));

vi.mock("../../lib/repositories/micro-posts", () => ({
  createMicroPost: createMicroPostMock,
  updateMicroPost: updateMicroPostMock,
}));

vi.mock("../../lib/repositories/comments", () => ({
  approveComment: approveCommentMock,
  removeComment: removeCommentMock,
}));

vi.mock("../../lib/repositories/guestbook", () => ({
  approveGuestbookEntry: approveGuestbookEntryMock,
  removeGuestbookEntry: removeGuestbookEntryMock,
}));

vi.mock("../../lib/db", () => ({
  db: {
    category: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    tag: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    post: {
      delete: vi.fn(),
      count: vi.fn(async () => 0),
    },
    microPost: {
      delete: vi.fn(),
    },
  },
}));

import {
  approveCommentAction,
  createCategoryAction,
  deletePostAction,
  updateMicroPostAction,
  updatePostAction,
} from "../../app/admin/actions";
import { db } from "../../lib/db";

describe("admin action cache behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a post without relying on next/cache.refresh and invalidates related routes", async () => {
    updatePostMock.mockResolvedValueOnce({
      id: "post-1",
      slug: "updated-post",
      status: "PUBLISHED",
    });

    const formData = new FormData();
    formData.set("title", "Updated");
    formData.set("slug", "updated-post");
    formData.set("markdown", "# Updated");
    formData.set("status", "PUBLISHED");

    await updatePostAction("post-1", formData);

    expect(redirectMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/posts");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/posts/post-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/posts");
    expect(revalidatePathMock).toHaveBeenCalledWith("/posts/updated-post");
    expect(revalidatePathMock).toHaveBeenCalledWith("/posts/page/[page]", "page");
    expect(revalidatePathMock).toHaveBeenCalledWith("/index.json");
    expect(revalidatePathMock).toHaveBeenCalledWith("/rss.xml");
  });

  it("creates a category without relying on next/cache.refresh", async () => {
    const formData = new FormData();
    formData.set("name", "Notes");
    formData.set("slug", "notes");

    await createCategoryAction(formData);

    expect(redirectMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/categories");
    expect(revalidatePathMock).toHaveBeenCalledWith("/posts");
  });

  it("redirects to the posts list and invalidates related routes after deleting a post", async () => {
    db.post.delete.mockResolvedValueOnce({
      id: "post-1",
      slug: "deleted-post",
    });

    await deletePostAction("post-1");

    expect(redirectMock).toHaveBeenCalledWith("/admin/posts");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/posts/post-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/posts/deleted-post");
    expect(revalidatePathMock).toHaveBeenCalledWith("/posts");
    expect(revalidatePathMock).toHaveBeenCalledWith("/posts/page/[page]", "page");
  });

  it("approves a comment without relying on next/cache.refresh", async () => {
    approveCommentMock.mockResolvedValueOnce({
      id: "comment-1",
      postId: "post-1",
    });

    await approveCommentAction("comment-1");

    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/comments");
  });

  it("updates a micro post without relying on next/cache.refresh and invalidates related routes", async () => {
    updateMicroPostMock.mockResolvedValueOnce({
      id: "micro-1",
      status: "PUBLISHED",
    });

    const formData = new FormData();
    formData.set("content", "Updated micro");
    formData.set("status", "PUBLISHED");

    await updateMicroPostAction("micro-1", formData);

    expect(redirectMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/micro-posts");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/micro-posts/micro-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/posts");
    expect(revalidatePathMock).toHaveBeenCalledWith("/posts/page/[page]", "page");
    expect(revalidatePathMock).toHaveBeenCalledWith("/index.json");
    expect(revalidatePathMock).toHaveBeenCalledWith("/rss.xml");
  });
});
