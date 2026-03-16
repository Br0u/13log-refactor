import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../lib/db";
import {
  createPost,
  getPublishedPostBySlug,
  getPublishedPosts,
  updatePost,
} from "../../../lib/repositories/posts";

describe("post repository", () => {
  let categoryId;
  const slugs = [
    "repository-test-post",
    "repository-update-post",
    "duplicate-slug",
  ];

  beforeAll(async () => {
    const category = await db.category.upsert({
      where: { slug: "notes" },
      update: {},
      create: {
        name: "Notes",
        slug: "notes",
      },
    });

    categoryId = category.id;
  });

  beforeEach(async () => {
    await db.postTag.deleteMany({
      where: {
        post: {
          slug: {
            in: slugs,
          },
        },
      },
    });

    await db.comment.deleteMany({
      where: {
        post: {
          slug: {
            in: slugs,
          },
        },
      },
    });

    await db.postLike.deleteMany({
      where: {
        post: {
          slug: {
            in: slugs,
          },
        },
      },
    });

    await db.post.deleteMany({
      where: {
        slug: {
          in: slugs,
        },
      },
    });
  });

  it("creates a post with one category and multiple tags", async () => {
    const post = await createPost({
      title: "Repository Test Post",
      slug: "repository-test-post",
      summary: "summary",
      markdown: "# hello",
      status: "PUBLISHED",
      categoryId,
      tags: ["backend", "database"],
    });

    expect(post.slug).toBe("repository-test-post");
    expect(post.categoryId).toBe(categoryId);
    expect(post.tags.map((item) => item.tag.slug).sort()).toEqual(["backend", "database"]);
  });

  it("updates a post and replaces tag relations", async () => {
    const original = await createPost({
      title: "Repository Update Post",
      slug: "repository-update-post",
      markdown: "body",
      status: "DRAFT",
      categoryId,
      tags: ["draft"],
    });

    const updated = await updatePost(original.id, {
      title: "Repository Update Post",
      slug: "repository-update-post",
      markdown: "updated body",
      status: "PUBLISHED",
      categoryId,
      tags: ["published", "release"],
    });

    expect(updated.tags.map((item) => item.tag.slug).sort()).toEqual(["published", "release"]);
    expect(updated.status).toBe("PUBLISHED");
  });

  it("keeps an explicit publishedAt when editing a published post", async () => {
    const original = await createPost({
      title: "Repository Update Post",
      slug: "repository-update-post",
      markdown: "body",
      status: "PUBLISHED",
      categoryId,
      tags: ["release"],
    });
    const expectedPublishedAt = new Date("2026-03-01T15:45:00.000Z");

    const updated = await updatePost(original.id, {
      title: "Repository Update Post",
      slug: "repository-update-post",
      markdown: "updated body",
      status: "PUBLISHED",
      publishedAt: expectedPublishedAt,
      categoryId,
      tags: ["release"],
    });

    expect(updated.publishedAt?.toISOString()).toBe(expectedPublishedAt.toISOString());
  });

  it("drops publishedAt when a post is saved as draft", async () => {
    const original = await createPost({
      title: "Repository Update Post",
      slug: "repository-update-post",
      markdown: "body",
      status: "PUBLISHED",
      categoryId,
      tags: ["release"],
    });

    const updated = await updatePost(original.id, {
      title: "Repository Update Post",
      slug: "repository-update-post",
      markdown: "updated body",
      status: "DRAFT",
      publishedAt: new Date("2026-03-01T15:45:00.000Z"),
      categoryId,
      tags: ["draft"],
    });

    expect(updated.publishedAt).toBeNull();
  });

  it("rejects duplicate slugs", async () => {
    await expect(
      createPost({
        title: "Duplicate Slug One",
        slug: "duplicate-slug",
        markdown: "body",
        status: "DRAFT",
        categoryId,
        tags: [],
      })
    ).resolves.toBeTruthy();

    await expect(
      createPost({
        title: "Duplicate Slug Two",
        slug: "duplicate-slug",
        markdown: "body",
        status: "DRAFT",
        categoryId,
        tags: [],
      })
    ).rejects.toThrow("Post slug already exists");
  });

  it("lists only published posts for public queries", async () => {
    await createPost({
      title: "Repository Test Post",
      slug: "repository-test-post",
      markdown: "# hello",
      status: "PUBLISHED",
      categoryId,
      tags: ["backend"],
    });

    await createPost({
      title: "Repository Update Post",
      slug: "repository-update-post",
      markdown: "updated body",
      status: "PUBLISHED",
      categoryId,
      tags: ["release"],
    });

    const published = await getPublishedPostBySlug("repository-test-post");
    const posts = await getPublishedPosts();

    expect(published?.slug).toBe("repository-test-post");
    expect(posts.every((item) => item.status === "PUBLISHED")).toBe(true);
    expect(posts.some((item) => item.slug === "repository-update-post")).toBe(true);
  });
});
