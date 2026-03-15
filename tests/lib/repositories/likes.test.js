import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../lib/db";
import { createPost } from "../../../lib/repositories/posts";
import { createPostLike, getPostLikeCount } from "../../../lib/repositories/likes";

describe("likes repository", () => {
  let categoryId;

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

    await createPost({
      title: "Likes Test Post",
      slug: "likes-test-post",
      markdown: "# like me",
      status: "PUBLISHED",
      categoryId,
      tags: ["likes"],
    });
  });

  it("creates only one like per visitor key", async () => {
    await createPostLike({ slug: "likes-test-post", visitorKey: "visitor-1" });
    await createPostLike({ slug: "likes-test-post", visitorKey: "visitor-1" });

    await expect(getPostLikeCount("likes-test-post")).resolves.toBe(1);
  });
});
