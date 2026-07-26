import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock, revalidatePathMock, requireAdminSessionMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  requireAdminSessionMock: vi.fn(),
}));

vi.mock("../../lib/admin-session", () => ({
  requireAdminSession: requireAdminSessionMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import { db } from "../../lib/db";
import { createPost } from "../../lib/repositories/posts";
import { createComment } from "../../lib/repositories/comments";
import { deletePostAction, deleteCommentAction } from "../../app/admin/actions";

describe("admin actions", () => {
  let categoryId;

  beforeAll(async () => {
    const category = await db.category.upsert({
      where: { slug: "test-13log-admin-category" },
      update: {},
      create: {
        name: "test-13log-admin-category",
        slug: "test-13log-admin-category",
      },
    });
    categoryId = category.id;
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    requireAdminSessionMock.mockResolvedValue({ username: "admin" });

    await db.comment.deleteMany({
      where: {
        post: {
          slug: {
            in: ["test-13log-admin-post", "test-13log-admin-comment-post"],
          },
        },
      },
    });
    await db.postTag.deleteMany({
      where: {
        post: {
          slug: {
            in: ["test-13log-admin-post", "test-13log-admin-comment-post"],
          },
        },
      },
    });
    await db.postLike.deleteMany({
      where: {
        post: {
          slug: {
            in: ["test-13log-admin-post", "test-13log-admin-comment-post"],
          },
        },
      },
    });
    await db.post.deleteMany({
      where: {
        slug: {
          in: ["test-13log-admin-post", "test-13log-admin-comment-post"],
        },
      },
    });
  });

  it("deletes a post from the admin action", async () => {
    const post = await createPost({
      title: "Admin Actions Post",
      slug: "test-13log-admin-post",
      markdown: "# delete",
      status: "PUBLISHED",
      categoryId,
      tags: ["test-13log-tag-admin"],
    });

    await deletePostAction(post.id);

    const deleted = await db.post.findUnique({
      where: { id: post.id },
    });

    expect(deleted).toBeNull();
    expect(redirectMock).toHaveBeenCalledWith("/admin/posts");
  });

  it("deletes a comment from the admin action", async () => {
    await createPost({
      title: "Admin Comment Post",
      slug: "test-13log-admin-comment-post",
      markdown: "# comments",
      status: "PUBLISHED",
      categoryId,
      tags: ["test-13log-tag-admin"],
    });

    const comment = await createComment({
      slug: "test-13log-admin-comment-post",
      nickname: "tester",
      content: "remove this",
    });

    await deleteCommentAction(comment.id);

    const deleted = await db.comment.findUnique({
      where: { id: comment.id },
    });

    expect(deleted).toBeNull();
  });
});
