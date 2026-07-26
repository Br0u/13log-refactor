import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../lib/db";
import { createPost } from "../../../lib/repositories/posts";
import { POST as likeRoute } from "../../../app/api/posts/[slug]/like/route";

describe("post like api", () => {
  let categoryId;

  beforeAll(async () => {
    const category = await db.category.upsert({
      where: { slug: "test-13log-likes-api-category" },
      update: {},
      create: {
        name: "test-13log-likes-api-category",
        slug: "test-13log-likes-api-category",
      },
    });
    categoryId = category.id;
  });

  beforeEach(async () => {
    await db.postLike.deleteMany({
      where: {
        post: { slug: "test-13log-likes-api-post" },
      },
    });
    await db.post.deleteMany({
      where: { slug: "test-13log-likes-api-post" },
    });

    await createPost({
      title: "Likes API Post",
      slug: "test-13log-likes-api-post",
      markdown: "# like route",
      status: "PUBLISHED",
      categoryId,
      tags: ["test-13log-tag-api"],
    });
  });

  it("returns the current count after a like request", async () => {
    const request = new Request(
      "http://localhost:3000/api/posts/test-13log-likes-api-post/like",
      {
        method: "POST",
        headers: {
          cookie: "visitor_key=api-visitor",
        },
      }
    );

    const response = await likeRoute(request, {
      params: Promise.resolve({ slug: "test-13log-likes-api-post" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(1);
  });
});
