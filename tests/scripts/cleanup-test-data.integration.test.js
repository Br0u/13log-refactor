import { describe, expect, it } from "vitest";
import { db } from "../../lib/db";
import {
  cleanupTestData,
  TEST_CATEGORY_SLUGS,
  TEST_GUESTBOOK_NICKNAMES,
  TEST_MICRO_POST_CONTENTS,
  TEST_SLUGS,
  TEST_TAG_SLUGS,
} from "../../scripts/cleanup-test-data.mjs";

const PREFIXED = {
  categorySlug: "test-13log-cleanup-category",
  tagSlug: "test-13log-tag-cleanup",
  postSlug: "test-13log-cleanup-post",
  microContent: "[test-13log] cleanup-integration",
  guestbookNickname: "test-13log-guestbook-cleanup",
};

const ADVISORY_LOCK_KEYS = [13, 1306];

describe("cleanupTestData", () => {
  it("removes only allowlisted prefixed fixtures and retains same-model sentinels", async () => {
    const runId = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const sentinel = {
      categorySlug: `sentinel-category-${runId}`,
      tagSlug: `sentinel-tag-${runId}`,
      postSlug: `sentinel-post-${runId}`,
      microContent: `sentinel micro ${runId}`,
      guestbookNickname: `sentinel-guestbook-${runId}`,
    };

    expect(TEST_CATEGORY_SLUGS).toContain(PREFIXED.categorySlug);
    expect(TEST_TAG_SLUGS).toContain(PREFIXED.tagSlug);
    expect(TEST_SLUGS).toContain(PREFIXED.postSlug);
    expect(TEST_MICRO_POST_CONTENTS).toContain(PREFIXED.microContent);
    expect(TEST_GUESTBOOK_NICKNAMES).toContain(PREFIXED.guestbookNickname);

    await db.$transaction(
      async (tx) => {
        await tx.$queryRawUnsafe(
          "SELECT pg_advisory_xact_lock($1::int, $2::int)",
          ...ADVISORY_LOCK_KEYS
        );

        try {
          await removeExactFixtures(tx, sentinel);

          const prefixedCategory = await tx.category.create({
            data: {
              name: `test-13log-cleanup-category-${runId}`,
              slug: PREFIXED.categorySlug,
            },
          });
          const sentinelCategory = await tx.category.create({
            data: {
              name: `Sentinel category ${runId}`,
              slug: sentinel.categorySlug,
            },
          });
          const prefixedTag = await tx.tag.create({
            data: {
              name: `test-13log-tag-cleanup-${runId}`,
              slug: PREFIXED.tagSlug,
            },
          });
          const sentinelTag = await tx.tag.create({
            data: {
              name: `Sentinel tag ${runId}`,
              slug: sentinel.tagSlug,
            },
          });
          const prefixedPost = await tx.post.create({
            data: {
              title: `Prefixed post ${runId}`,
              slug: PREFIXED.postSlug,
              markdown: "prefixed",
              categoryId: prefixedCategory.id,
              tags: { create: { tagId: prefixedTag.id } },
            },
          });
          const sentinelPost = await tx.post.create({
            data: {
              title: `Sentinel post ${runId}`,
              slug: sentinel.postSlug,
              markdown: "sentinel",
              categoryId: sentinelCategory.id,
              tags: { create: { tagId: sentinelTag.id } },
            },
          });
          const prefixedMicro = await tx.microPost.create({
            data: {
              content: PREFIXED.microContent,
              tags: { create: { tagId: prefixedTag.id } },
            },
          });
          const sentinelMicro = await tx.microPost.create({
            data: {
              content: sentinel.microContent,
              tags: { create: { tagId: sentinelTag.id } },
            },
          });
          const prefixedGuestbook = await tx.guestbookEntry.create({
            data: {
              nickname: PREFIXED.guestbookNickname,
              content: `prefixed ${runId}`,
            },
          });
          const sentinelGuestbook = await tx.guestbookEntry.create({
            data: {
              nickname: sentinel.guestbookNickname,
              content: `sentinel ${runId}`,
            },
          });

          await cleanupTestData(tx);

          await expect(
            tx.category.findUnique({ where: { id: prefixedCategory.id } })
          ).resolves.toBeNull();
          await expect(
            tx.tag.findUnique({ where: { id: prefixedTag.id } })
          ).resolves.toBeNull();
          await expect(
            tx.post.findUnique({ where: { id: prefixedPost.id } })
          ).resolves.toBeNull();
          await expect(
            tx.microPost.findUnique({ where: { id: prefixedMicro.id } })
          ).resolves.toBeNull();
          await expect(
            tx.guestbookEntry.findUnique({ where: { id: prefixedGuestbook.id } })
          ).resolves.toBeNull();

          await expect(
            tx.category.findUnique({ where: { id: sentinelCategory.id } })
          ).resolves.toBeTruthy();
          await expect(
            tx.tag.findUnique({ where: { id: sentinelTag.id } })
          ).resolves.toBeTruthy();
          await expect(
            tx.post.findUnique({ where: { id: sentinelPost.id } })
          ).resolves.toBeTruthy();
          await expect(
            tx.microPost.findUnique({ where: { id: sentinelMicro.id } })
          ).resolves.toBeTruthy();
          await expect(
            tx.guestbookEntry.findUnique({ where: { id: sentinelGuestbook.id } })
          ).resolves.toBeTruthy();
        } finally {
          await removeExactFixtures(tx, sentinel);
        }
      },
      { maxWait: 30_000, timeout: 30_000 }
    );
  });
});

async function removeExactFixtures(tx, sentinel) {
  await tx.microPostTag.deleteMany({
    where: {
      microPost: {
        content: { in: [PREFIXED.microContent, sentinel.microContent] },
      },
    },
  });
  await tx.microPost.deleteMany({
    where: { content: { in: [PREFIXED.microContent, sentinel.microContent] } },
  });
  await tx.postTag.deleteMany({
    where: {
      post: { slug: { in: [PREFIXED.postSlug, sentinel.postSlug] } },
    },
  });
  await tx.post.deleteMany({
    where: { slug: { in: [PREFIXED.postSlug, sentinel.postSlug] } },
  });
  await tx.guestbookEntry.deleteMany({
    where: {
      nickname: {
        in: [PREFIXED.guestbookNickname, sentinel.guestbookNickname],
      },
    },
  });
  await tx.tag.deleteMany({
    where: { slug: { in: [PREFIXED.tagSlug, sentinel.tagSlug] } },
  });
  await tx.category.deleteMany({
    where: {
      slug: { in: [PREFIXED.categorySlug, sentinel.categorySlug] },
    },
  });
}
