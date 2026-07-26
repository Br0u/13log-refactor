import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../lib/db";
import { createPost } from "../../../lib/repositories/posts";
import { GET as commentsGetRoute, POST as commentsPostRoute } from "../../../app/api/posts/[slug]/comments/route";

describe("comments api", () => {
  let categoryId;

  beforeAll(async () => {
    const category = await db.category.upsert({
      where: { slug: "test-13log-comments-api-category" },
      update: {},
      create: {
        name: "test-13log-comments-api-category",
        slug: "test-13log-comments-api-category",
      },
    });
    categoryId = category.id;
  });

  beforeEach(async () => {
    await db.comment.deleteMany({
      where: {
        post: { slug: "test-13log-comments-api-post" },
      },
    });
    await db.post.deleteMany({
      where: { slug: "test-13log-comments-api-post" },
    });

    await createPost({
      title: "Comments API Post",
      slug: "test-13log-comments-api-post",
      markdown: "# comments",
      status: "PUBLISHED",
      categoryId,
      tags: ["test-13log-tag-api"],
    });
  });

  it("creates and lists comments via the public route", async () => {
    const postRequest = new Request(
      "http://localhost:3000/api/posts/test-13log-comments-api-post/comments",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          nickname: "visitor",
          content: "hello there",
        }),
      }
    );

    const postResponse = await commentsPostRoute(postRequest, {
      params: Promise.resolve({ slug: "test-13log-comments-api-post" }),
    });

    expect(postResponse.status).toBe(201);

    const getResponse = await commentsGetRoute(
      new Request(
        "http://localhost:3000/api/posts/test-13log-comments-api-post/comments"
      ),
      {
        params: Promise.resolve({ slug: "test-13log-comments-api-post" }),
      }
    );
    const body = await getResponse.json();

    expect(body.comments).toHaveLength(1);
    expect(body.comments[0].nickname).toBe("visitor");
  });
});
