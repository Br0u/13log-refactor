import { describe, expect, it } from "vitest";
import { db } from "../../lib/db";
import { createPost } from "../../lib/repositories/posts";
import { generateMetadata } from "../../app/posts/[slug]/page";
import { GET as indexJsonRoute } from "../../app/index.json/route";
import { GET as rssRoute } from "../../app/rss.xml/route";

describe("public content routes", () => {
  it("resolves post metadata from the database-backed content layer", async () => {
    const slug = "test-13log-public-route-post";
    const category = await db.category.upsert({
      where: { slug: "test-13log-public-route-category" },
      update: {},
      create: {
        name: "test-13log-public-route-category",
        slug: "test-13log-public-route-category",
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
      title: "Public Route Test Post",
      slug,
      markdown: "# route",
      status: "PUBLISHED",
      categoryId: category.id,
      tags: ["test-13log-tag-route"],
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug }),
    });

    expect(metadata.title).toBe("Public Route Test Post | 我的小小世界");
  });

  it("serves index.json from public content", async () => {
    const response = await indexJsonRoute();
    const docs = await response.json();

    expect(Array.isArray(docs)).toBe(true);
    expect(docs.some((item) => item.title.includes("Post"))).toBe(true);
  });

  it("serves rss items from public content", async () => {
    const response = await rssRoute();
    const xml = await response.text();

    expect(xml).toContain("<rss");
    expect(xml).toContain("<item><title>");
    expect(xml).toContain("/posts/");
  });
});
