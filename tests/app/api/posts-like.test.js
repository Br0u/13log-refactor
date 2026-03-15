import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../lib/db";
import { createPost } from "../../../lib/repositories/posts";
import { POST as likeRoute } from "../../../app/api/posts/[slug]/like/route";

describe("post like api", () => {
  let categoryId;

  beforeAll(async () => {
    const category = await db.category.upsert({
      where: { slug: "likes-api-test" },
      update: {},
      create: {
        name: "Likes API Test",
        slug: "likes-api-test",
      },
    });
    categoryId = category.id;
  });

  beforeEach(async () => {
    await db.postLike.deleteMany({
      where: {
        post: { slug: "likes-api-post" },
      },
    });
    await db.post.deleteMany({
      where: { slug: "likes-api-post" },
    });

    await createPost({
      title: "Likes API Post",
      slug: "likes-api-post",
      markdown: "# like route",
      status: "PUBLISHED",
      categoryId,
      tags: ["api"],
    });
  });

  it("returns the current count after a like request", async () => {
    const request = new Request("http://localhost:3000/api/posts/likes-api-post/like", {
      method: "POST",
      headers: {
        cookie: "visitor_key=api-visitor",
      },
    });

    const response = await likeRoute(request, {
      params: Promise.resolve({ slug: "likes-api-post" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(1);
  });
});
