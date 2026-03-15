import { describe, expect, it } from "vitest";
import { db } from "../../lib/db";
import { createPost } from "../../lib/repositories/posts";
import { getPublicPostBySlug, getPublicPosts } from "../../lib/public-content";

describe("public content facade", () => {
  it("returns published database content by slug", async () => {
    const slug = "public-facade-test-post";
    const category = await db.category.upsert({
      where: { slug: "public-test" },
      update: {},
      create: {
        name: "Public Test",
        slug: "public-test",
      },
    });

    await db.postTag.deleteMany({
      where: {
        post: {
          slug,
        },
      },
    });
    await db.post.deleteMany({
      where: {
        slug,
      },
    });

    await createPost({
      title: "Public Facade Test Post",
      slug,
      markdown: "# hello",
      status: "PUBLISHED",
      categoryId: category.id,
      tags: ["backend"],
    });

    const post = await getPublicPostBySlug(slug);

    expect(post?.slug).toBe(slug);
    expect(post?.title).toBe("Public Facade Test Post");
  });

  it("returns only published posts", async () => {
    const posts = await getPublicPosts();

    expect(posts.length).toBeGreaterThan(0);
    expect(posts.every((item) => item.status === "PUBLISHED")).toBe(true);
  });
});
