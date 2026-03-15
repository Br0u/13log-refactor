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
      where: { slug: "comments-test" },
      update: {},
      create: {
        name: "Comments Test",
        slug: "comments-test",
      },
    });
    categoryId = category.id;
  });

  beforeEach(async () => {
    await db.comment.deleteMany({
      where: {
        post: { slug: "comments-test-post" },
      },
    });
    await db.post.deleteMany({
      where: { slug: "comments-test-post" },
    });

    await createPost({
      title: "Comments Test Post",
      slug: "comments-test-post",
      markdown: "# comments",
      status: "PUBLISHED",
      categoryId,
      tags: ["comments"],
    });
  });

  it("creates an approved comment and increments the counter", async () => {
    await createComment({
      slug: "comments-test-post",
      nickname: "brou",
      content: "first comment",
    });

    const comments = await getApprovedCommentsBySlug("comments-test-post");
    const post = await db.post.findUnique({
      where: { slug: "comments-test-post" },
    });

    expect(comments).toHaveLength(1);
    expect(comments[0].nickname).toBe("brou");
    expect(post?.commentCount).toBe(1);
  });

  it("removes a comment and decrements the counter", async () => {
    const comment = await createComment({
      slug: "comments-test-post",
      nickname: "brou",
      content: "delete me",
    });

    await removeComment(comment.id);

    const comments = await getApprovedCommentsBySlug("comments-test-post");
    const post = await db.post.findUnique({
      where: { slug: "comments-test-post" },
    });

    expect(comments).toHaveLength(0);
    expect(post?.commentCount).toBe(0);
  });
});
