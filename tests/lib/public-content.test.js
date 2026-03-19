import { describe, expect, it } from "vitest";
import { db } from "../../lib/db";
import { createMicroPost } from "../../lib/repositories/micro-posts";
import { createMicroPostLike } from "../../lib/repositories/likes";
import { createPost } from "../../lib/repositories/posts";
import { getPublicPostBySlug, getPublicPosts, getPublicTimelineEntries } from "../../lib/public-content";

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

  it("merges published posts and micro posts into one timeline", async () => {
    const slug = "public-facade-timeline-post";
    const category = await db.category.upsert({
      where: { slug: "public-timeline-test" },
      update: {},
      create: {
        name: "Public Timeline Test",
        slug: "public-timeline-test",
      },
    });

    await db.postTag.deleteMany({
      where: {
        post: { slug },
      },
    });
    await db.post.deleteMany({
      where: { slug },
    });
    await db.microPostTag.deleteMany({
      where: {
        microPost: {
          content: {
            in: ["timeline micro published", "timeline micro draft"],
          },
        },
      },
    });
    await db.microPost.deleteMany({
      where: {
        content: {
          in: ["timeline micro published", "timeline micro draft"],
        },
      },
    });

    await createPost({
      title: "Timeline Post",
      slug,
      markdown: "# timeline",
      status: "PUBLISHED",
      publishedAt: new Date("2026-03-14T10:00:00.000Z"),
      categoryId: category.id,
      tags: ["timeline"],
    });

    await createMicroPost({
      content: "timeline micro published",
      status: "PUBLISHED",
      publishedAt: new Date("2026-03-15T10:00:00.000Z"),
      tags: ["timeline"],
    });

    await createMicroPost({
      content: "timeline micro draft",
      status: "DRAFT",
      tags: ["timeline"],
    });

    const publishedMicroPost = await db.microPost.findFirst({
      where: {
        content: "timeline micro published",
      },
    });
    await createMicroPostLike({ id: publishedMicroPost.id, visitorKey: "timeline-visitor" });

    const entries = await getPublicTimelineEntries();
    const timelineEntries = entries.filter((item) => (
      item.slug === slug || item.summary === "timeline micro published" || item.summary === "timeline micro draft"
    ));

    expect(timelineEntries.map((item) => item.type)).toEqual(["micro", "post"]);
    expect(timelineEntries[0].summary).toBe("timeline micro published");
    expect(timelineEntries[0].likeCount).toBe(1);
    expect(timelineEntries[0].hasImage).toBe(false);
    expect(timelineEntries[0].renderedContentHtml).toBe("");
    expect(timelineEntries.every((item) => item.summary !== "timeline micro draft")).toBe(true);
  });

  it("marks image micros in the public timeline payload", async () => {
    await db.microPostTag.deleteMany({
      where: {
        microPost: {
          content: {
            in: ["timeline image micro"],
          },
        },
      },
    });
    await db.microPost.deleteMany({
      where: {
        content: {
          in: ["timeline image micro"],
        },
      },
    });

    await createMicroPost({
      content: "![alt](/images/test.jpg)\n\ntimeline image micro",
      status: "PUBLISHED",
      publishedAt: new Date("2026-03-16T10:00:00.000Z"),
      tags: ["timeline"],
    });

    const entries = await getPublicTimelineEntries();
    const imageEntry = entries.find((item) => item.type === "micro" && item.summary.includes("timeline image micro"));

    expect(imageEntry?.hasImage).toBe(true);
    expect(imageEntry?.renderedContentHtml).toContain("<img");
  });

  it("keeps rich html for formatted text micros", async () => {
    await db.microPostTag.deleteMany({
      where: {
        microPost: {
          content: {
            in: ["第一行\n第二行\n\n- 列表项"],
          },
        },
      },
    });
    await db.microPost.deleteMany({
      where: {
        content: {
          in: ["第一行\n第二行\n\n- 列表项"],
        },
      },
    });

    await createMicroPost({
      content: "第一行\n第二行\n\n- 列表项",
      status: "PUBLISHED",
      publishedAt: new Date("2026-03-17T10:00:00.000Z"),
      tags: ["timeline"],
    });

    const entries = await getPublicTimelineEntries();
    const richEntry = entries.find((item) => item.type === "micro" && item.summary.includes("列表项"));

    expect(richEntry?.renderedContentHtml).toContain("<ul>");
  });
});
