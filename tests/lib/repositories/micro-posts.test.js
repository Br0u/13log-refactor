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
          in: [
            "[test-13log] repository-draft",
            "[test-13log] repository-published",
            "[test-13log] repository-updated",
          ],
        },
      },
    });
  });

  it("creates and updates a tagged micro post", async () => {
    const created = await createMicroPost({
      content: "[test-13log] repository-draft",
      status: "DRAFT",
      tags: ["test-13log-tag-mood"],
    });
    ids.push(created.id);

    const updated = await updateMicroPost(created.id, {
      content: "[test-13log] repository-updated",
      status: "PUBLISHED",
      tags: ["test-13log-tag-mood", "test-13log-tag-timeline"],
    });

    expect(updated.content).toBe("[test-13log] repository-updated");
    expect(updated.status).toBe("PUBLISHED");
    expect(updated.tags.map((item) => item.tag.slug).sort()).toEqual([
      "test-13log-tag-mood",
      "test-13log-tag-timeline",
    ]);
  });

  it("lists only published micro posts for public queries", async () => {
    const draft = await createMicroPost({
      content: "[test-13log] repository-draft",
      status: "DRAFT",
      tags: ["test-13log-tag-draft"],
    });
    const published = await createMicroPost({
      content: "[test-13log] repository-published",
      status: "PUBLISHED",
      tags: ["test-13log-tag-published"],
    });

    ids.push(draft.id, published.id);

    const entries = await getPublishedMicroPosts();

    expect(entries.some((item) => item.id === published.id)).toBe(true);
    expect(entries.some((item) => item.id === draft.id)).toBe(false);
  });

  it("keeps an explicit publishedAt when editing a published micro post", async () => {
    const created = await createMicroPost({
      content: "[test-13log] repository-draft",
      status: "PUBLISHED",
      tags: ["test-13log-tag-mood"],
    });
    ids.push(created.id);
    const expectedPublishedAt = new Date("2026-03-01T15:45:00.000Z");

    const updated = await updateMicroPost(created.id, {
      content: "[test-13log] repository-updated",
      status: "PUBLISHED",
      publishedAt: expectedPublishedAt,
      tags: ["test-13log-tag-mood", "test-13log-tag-timeline"],
    });

    expect(updated.publishedAt?.toISOString()).toBe(expectedPublishedAt.toISOString());
  });

  it("drops publishedAt when a micro post is saved as draft", async () => {
    const created = await createMicroPost({
      content: "[test-13log] repository-published",
      status: "PUBLISHED",
      tags: ["test-13log-tag-mood"],
    });
    ids.push(created.id);

    const updated = await updateMicroPost(created.id, {
      content: "[test-13log] repository-updated",
      status: "DRAFT",
      publishedAt: new Date("2026-03-01T15:45:00.000Z"),
      tags: ["test-13log-tag-draft"],
    });

    expect(updated.publishedAt).toBeNull();
  });
});
