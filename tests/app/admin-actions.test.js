import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../lib/db";
import { createPost } from "../../lib/repositories/posts";
import { createComment } from "../../lib/repositories/comments";
import { deletePostAction, deleteCommentAction } from "../../app/admin/actions";

describe("admin actions", () => {
  let categoryId;

  beforeAll(async () => {
    const category = await db.category.upsert({
      where: { slug: "admin-actions-test" },
      update: {},
      create: {
        name: "Admin Actions Test",
        slug: "admin-actions-test",
      },
    });
    categoryId = category.id;
  });

  beforeEach(async () => {
    await db.comment.deleteMany({
      where: {
        post: {
          slug: {
            in: ["admin-actions-post", "admin-actions-comment-post"],
          },
        },
      },
    });
    await db.postTag.deleteMany({
      where: {
        post: {
          slug: {
            in: ["admin-actions-post", "admin-actions-comment-post"],
          },
        },
      },
    });
    await db.postLike.deleteMany({
      where: {
        post: {
          slug: {
            in: ["admin-actions-post", "admin-actions-comment-post"],
          },
        },
      },
    });
    await db.post.deleteMany({
      where: {
        slug: {
          in: ["admin-actions-post", "admin-actions-comment-post"],
        },
      },
    });
  });

  it("deletes a post from the admin action", async () => {
    const post = await createPost({
      title: "Admin Actions Post",
      slug: "admin-actions-post",
      markdown: "# delete",
      status: "PUBLISHED",
      categoryId,
      tags: ["admin"],
    });

    await deletePostAction(post.id);

    const deleted = await db.post.findUnique({
      where: { id: post.id },
    });

    expect(deleted).toBeNull();
  });

  it("deletes a comment from the admin action", async () => {
    await createPost({
      title: "Admin Comment Post",
      slug: "admin-actions-comment-post",
      markdown: "# comments",
      status: "PUBLISHED",
      categoryId,
      tags: ["admin"],
    });

    const comment = await createComment({
      slug: "admin-actions-comment-post",
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
