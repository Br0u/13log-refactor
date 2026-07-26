import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../lib/db";
import { createMicroPost } from "../../../lib/repositories/micro-posts";
import { POST as likeRoute } from "../../../app/api/micro-posts/[id]/like/route";

describe("micro post like api", () => {
  let microPostId;

  beforeEach(async () => {
    await db.microPostLike.deleteMany({
      where: {
        microPost: { content: "[test-13log] likes-api" },
      },
    });
    await db.microPost.deleteMany({
      where: { content: "[test-13log] likes-api" },
    });

    const microPost = await createMicroPost({
      content: "[test-13log] likes-api",
      status: "PUBLISHED",
      tags: ["test-13log-tag-api"],
    });
    microPostId = microPost.id;
  });

  it("returns the current count after a like request", async () => {
    const request = new Request(`http://localhost:3000/api/micro-posts/${microPostId}/like`, {
      method: "POST",
      headers: {
        cookie: "visitor_key=api-visitor",
      },
    });

    const response = await likeRoute(request, {
      params: Promise.resolve({ id: microPostId }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(1);
  });
});
