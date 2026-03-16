import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../lib/db";
import {
  createMicroPost,
  getPublishedMicroPosts,
  updateMicroPost,
} from "../../../lib/repositories/micro-posts";

describe("micro post repository", () => {
  const ids = [];

  beforeEach(async () => {
    if (ids.length > 0) {
      await db.microPostTag.deleteMany({
        where: {
          microPostId: {
            in: ids.splice(0, ids.length),
          },
        },
      });
    }

    await db.microPost.deleteMany({
      where: {
        content: {
          in: ["micro draft", "micro published", "micro updated"],
        },
      },
    });
  });

  it("creates and updates a tagged micro post", async () => {
    const created = await createMicroPost({
      content: "micro draft",
      status: "DRAFT",
      tags: ["mood"],
    });
    ids.push(created.id);

    const updated = await updateMicroPost(created.id, {
      content: "micro updated",
      status: "PUBLISHED",
      tags: ["mood", "timeline"],
    });

    expect(updated.content).toBe("micro updated");
    expect(updated.status).toBe("PUBLISHED");
    expect(updated.tags.map((item) => item.tag.slug).sort()).toEqual(["mood", "timeline"]);
  });

  it("lists only published micro posts for public queries", async () => {
    const draft = await createMicroPost({
      content: "micro draft",
      status: "DRAFT",
      tags: ["draft"],
    });
    const published = await createMicroPost({
      content: "micro published",
      status: "PUBLISHED",
      tags: ["published"],
    });

    ids.push(draft.id, published.id);

    const entries = await getPublishedMicroPosts();

    expect(entries.some((item) => item.id === published.id)).toBe(true);
    expect(entries.some((item) => item.id === draft.id)).toBe(false);
  });
});
