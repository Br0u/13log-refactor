import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../lib/db";
import { createPost } from "../../../lib/repositories/posts";
import {
  createComment,
  getApprovedCommentsBySlug,
  removeComment,
} from "../../../lib/repositories/comments";

describe("comments repository", () => {
  let categoryId;

  beforeAll(async () => {
    const category = await db.category.upsert({
      where: { slug: "test-13log-comments-category" },
      update: {},
      create: {
        name: "test-13log-comments-category",
        slug: "test-13log-comments-category",
      },
    });
    categoryId = category.id;
  });

  beforeEach(async () => {
    await db.comment.deleteMany({
      where: {
        post: { slug: "test-13log-comments-post" },
      },
    });
    await db.post.deleteMany({
      where: { slug: "test-13log-comments-post" },
    });

    await createPost({
      title: "Comments Test Post",
      slug: "test-13log-comments-post",
      markdown: "# comments",
      status: "PUBLISHED",
      categoryId,
      tags: ["test-13log-tag-comments"],
    });
  });

  it("creates an approved comment and increments the counter", async () => {
    await createComment({
      slug: "test-13log-comments-post",
      nickname: "brou",
      content: "first comment",
    });

    const comments = await getApprovedCommentsBySlug("test-13log-comments-post");
    const post = await db.post.findUnique({
      where: { slug: "test-13log-comments-post" },
    });

    expect(comments).toHaveLength(1);
    expect(comments[0].nickname).toBe("brou");
    expect(post?.commentCount).toBe(1);
  });

  it("removes a comment and decrements the counter", async () => {
    const comment = await createComment({
      slug: "test-13log-comments-post",
      nickname: "brou",
      content: "delete me",
    });

    await removeComment(comment.id);

    const comments = await getApprovedCommentsBySlug("test-13log-comments-post");
    const post = await db.post.findUnique({
      where: { slug: "test-13log-comments-post" },
    });

    expect(comments).toHaveLength(0);
    expect(post?.commentCount).toBe(0);
  });
});
