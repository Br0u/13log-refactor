import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../lib/db";
import { createMicroPost } from "../../../lib/repositories/micro-posts";
import { createPost } from "../../../lib/repositories/posts";
import {
  createMicroPostLike,
  createPostLike,
  getMicroPostLikeCount,
  getPostLikeCount,
} from "../../../lib/repositories/likes";

describe("likes repository", () => {
  let categoryId;
  let microPostId;

  beforeAll(async () => {
    const category = await db.category.upsert({
      where: { slug: "likes-test" },
      update: {},
      create: {
        name: "Likes Test",
        slug: "likes-test",
      },
    });
    categoryId = category.id;
  });

  beforeEach(async () => {
    await db.postLike.deleteMany({
      where: {
        post: { slug: "likes-test-post" },
      },
    });
    await db.post.deleteMany({
      where: { slug: "likes-test-post" },
    });
    await db.microPostLike.deleteMany({
      where: {
        microPost: { content: "likes-test-micro-post" },
      },
    });
    await db.microPost.deleteMany({
      where: { content: "likes-test-micro-post" },
    });

    await createPost({
      title: "Likes Test Post",
      slug: "likes-test-post",
      markdown: "# like me",
      status: "PUBLISHED",
      categoryId,
      tags: ["likes"],
    });

    const microPost = await createMicroPost({
      content: "likes-test-micro-post",
      status: "PUBLISHED",
      tags: ["likes"],
    });
    microPostId = microPost.id;
  });

  it("creates only one like per visitor key", async () => {
    await createPostLike({ slug: "likes-test-post", visitorKey: "visitor-1" });
    await createPostLike({ slug: "likes-test-post", visitorKey: "visitor-1" });

    await expect(getPostLikeCount("likes-test-post")).resolves.toBe(1);
  });

  it("creates only one micropost like per visitor key", async () => {
    await createMicroPostLike({ id: microPostId, visitorKey: "visitor-1" });
    await createMicroPostLike({ id: microPostId, visitorKey: "visitor-1" });

    await expect(getMicroPostLikeCount(microPostId)).resolves.toBe(1);
  });
});
