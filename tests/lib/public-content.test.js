import { describe, expect, it, vi } from "vitest";
import { db } from "../../lib/db";
import * as markdown from "../../lib/markdown";
import { createMicroPost } from "../../lib/repositories/micro-posts";
import { createMicroPostLike } from "../../lib/repositories/likes";
import { createPost } from "../../lib/repositories/posts";
import { getPublicPostBySlug, getPublicPosts, getPublicTimelineEntries } from "../../lib/public-content";

describe("public content facade", () => {
  it("returns published database content by slug", async () => {
    const slug = "test-13log-public-facade-post";
    const category = await db.category.upsert({
      where: { slug: "test-13log-public-category" },
      update: {},
      create: {
        name: "test-13log-public-category",
        slug: "test-13log-public-category",
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
      tags: ["test-13log-tag-backend"],
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
    const slug = "test-13log-public-timeline-post";
    const category = await db.category.upsert({
      where: { slug: "test-13log-public-timeline-category" },
      update: {},
      create: {
        name: "test-13log-public-timeline-category",
        slug: "test-13log-public-timeline-category",
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
            in: [
              "[test-13log] public-timeline-published",
              "[test-13log] public-timeline-draft",
            ],
          },
        },
      },
    });
    await db.microPost.deleteMany({
      where: {
        content: {
          in: [
            "[test-13log] public-timeline-published",
            "[test-13log] public-timeline-draft",
          ],
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
      tags: ["test-13log-tag-timeline"],
    });

    await createMicroPost({
      content: "[test-13log] public-timeline-published",
      status: "PUBLISHED",
      publishedAt: new Date("2026-03-15T10:00:00.000Z"),
      tags: ["test-13log-tag-timeline"],
    });

    await createMicroPost({
      content: "[test-13log] public-timeline-draft",
      status: "DRAFT",
      tags: ["test-13log-tag-timeline"],
    });

    const publishedMicroPost = await db.microPost.findFirst({
      where: {
        content: "[test-13log] public-timeline-published",
      },
    });
    await createMicroPostLike({ id: publishedMicroPost.id, visitorKey: "timeline-visitor" });

    const entries = await getPublicTimelineEntries();
    const timelineEntries = entries.filter((item) => (
      item.slug === slug ||
      item.summary === "[test-13log] public-timeline-published" ||
      item.summary === "[test-13log] public-timeline-draft"
    ));

    expect(timelineEntries.map((item) => item.type)).toEqual(["micro", "post"]);
    expect(timelineEntries[0].summary).toBe("[test-13log] public-timeline-published");
    expect(timelineEntries[0].likeCount).toBe(1);
    expect(timelineEntries[0].hasImage).toBe(false);
    expect(timelineEntries[0].renderedContentHtml).toBe("");
    expect(
      timelineEntries.every((item) => item.summary !== "[test-13log] public-timeline-draft")
    ).toBe(true);
  });

  it("marks image micros in the public timeline payload", async () => {
    await db.microPostTag.deleteMany({
      where: {
        microPost: {
          content: {
            in: ["[test-13log] public-timeline-image\n\n![alt](/images/test.jpg)"],
          },
        },
      },
    });
    await db.microPost.deleteMany({
      where: {
        content: {
          in: ["[test-13log] public-timeline-image\n\n![alt](/images/test.jpg)"],
        },
      },
    });

    await createMicroPost({
      content: "[test-13log] public-timeline-image\n\n![alt](/images/test.jpg)",
      status: "PUBLISHED",
      publishedAt: new Date("2026-03-16T10:00:00.000Z"),
      tags: ["test-13log-tag-timeline"],
    });

    const entries = await getPublicTimelineEntries();
    const imageEntry = entries.find(
      (item) => item.type === "micro" && item.summary.includes("public-timeline-image")
    );

    expect(imageEntry?.hasImage).toBe(true);
    expect(imageEntry?.renderedContentHtml).toContain("<img");
  });

  it("keeps rich html for formatted text micros", async () => {
    await db.microPostTag.deleteMany({
      where: {
        microPost: {
          content: {
            in: ["[test-13log] public-rich\n\n第一行\n第二行\n\n- 列表项"],
          },
        },
      },
    });
    await db.microPost.deleteMany({
      where: {
        content: {
          in: ["[test-13log] public-rich\n\n第一行\n第二行\n\n- 列表项"],
        },
      },
    });

    await createMicroPost({
      content: "[test-13log] public-rich\n\n第一行\n第二行\n\n- 列表项",
      status: "PUBLISHED",
      publishedAt: new Date("2026-03-17T10:00:00.000Z"),
      tags: ["test-13log-tag-timeline"],
    });

    const entries = await getPublicTimelineEntries();
    const richEntry = entries.find((item) => item.type === "micro" && item.summary.includes("列表项"));

    expect(richEntry?.renderedContentHtml).toContain("<ul>");
  });

  it("filters timeline entries before rendering unrelated micro html", async () => {
    const renderSpy = vi.spyOn(markdown, "renderMicroMarkdownToHtml");

    await db.microPostTag.deleteMany({
      where: {
        microPost: {
          content: {
            in: [
              "[test-13log] public-filter-match\n\n筛选命中的 rich micro\n\n- 列表项",
              "[test-13log] public-filter-other\n\n筛选外的 rich micro\n\n- 列表项",
            ],
          },
        },
      },
    });
    await db.microPost.deleteMany({
      where: {
        content: {
          in: [
            "[test-13log] public-filter-match\n\n筛选命中的 rich micro\n\n- 列表项",
            "[test-13log] public-filter-other\n\n筛选外的 rich micro\n\n- 列表项",
          ],
        },
      },
    });

    await createMicroPost({
      content: "[test-13log] public-filter-match\n\n筛选命中的 rich micro\n\n- 列表项",
      status: "PUBLISHED",
      publishedAt: new Date("2026-03-18T10:00:00.000Z"),
      tags: ["test-13log-tag-match"],
    });

    await createMicroPost({
      content: "[test-13log] public-filter-other\n\n筛选外的 rich micro\n\n- 列表项",
      status: "PUBLISHED",
      publishedAt: new Date("2026-03-18T09:00:00.000Z"),
      tags: ["test-13log-tag-other"],
    });

    const entries = await getPublicTimelineEntries({ tag: "test-13log-tag-match" });

    expect(entries.some((item) => item.type === "micro" && item.summary.includes("筛选命中的 rich micro"))).toBe(true);
    expect(entries.some((item) => item.type === "micro" && item.summary.includes("筛选外的 rich micro"))).toBe(false);
    expect(renderSpy.mock.calls.some(([source]) => String(source).includes("筛选命中的 rich micro"))).toBe(true);
    expect(renderSpy.mock.calls.some(([source]) => String(source).includes("筛选外的 rich micro"))).toBe(false);
  });
});
