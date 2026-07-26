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
      where: { slug: "test-13log-likes-category" },
      update: {},
      create: {
        name: "test-13log-likes-category",
        slug: "test-13log-likes-category",
      },
    });
    categoryId = category.id;
  });

  beforeEach(async () => {
    await db.postLike.deleteMany({
      where: {
        post: { slug: "test-13log-likes-post" },
      },
    });
    await db.post.deleteMany({
      where: { slug: "test-13log-likes-post" },
    });
    await db.microPostLike.deleteMany({
      where: {
        microPost: { content: "[test-13log] likes-repository" },
      },
    });
    await db.microPost.deleteMany({
      where: { content: "[test-13log] likes-repository" },
    });

    await createPost({
      title: "Likes Test Post",
      slug: "test-13log-likes-post",
      markdown: "# like me",
      status: "PUBLISHED",
      categoryId,
      tags: ["test-13log-tag-likes"],
    });

    const microPost = await createMicroPost({
      content: "[test-13log] likes-repository",
      status: "PUBLISHED",
      tags: ["test-13log-tag-likes"],
    });
    microPostId = microPost.id;
  });

  it("creates only one like per visitor key", async () => {
    await createPostLike({ slug: "test-13log-likes-post", visitorKey: "visitor-1" });
    await createPostLike({ slug: "test-13log-likes-post", visitorKey: "visitor-1" });

    await expect(getPostLikeCount("test-13log-likes-post")).resolves.toBe(1);
  });

  it("creates only one micropost like per visitor key", async () => {
    await createMicroPostLike({ id: microPostId, visitorKey: "visitor-1" });
    await createMicroPostLike({ id: microPostId, visitorKey: "visitor-1" });

    await expect(getMicroPostLikeCount(microPostId)).resolves.toBe(1);
  });
});
