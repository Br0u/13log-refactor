import { resolveTestDatabaseEnv } from "./lib/test-database-guard.mjs";

export const TEST_SLUGS = [
  "test-13log-repository-post",
  "test-13log-repository-update-post",
  "test-13log-repository-duplicate-slug",
  "test-13log-public-facade-post",
  "test-13log-public-timeline-post",
  "test-13log-public-route-post",
  "test-13log-likes-post",
  "test-13log-likes-api-post",
  "test-13log-comments-post",
  "test-13log-comments-api-post",
  "test-13log-admin-post",
  "test-13log-admin-comment-post",
  "test-13log-cleanup-post",
];

export const TEST_CATEGORY_SLUGS = [
  "test-13log-repository-category",
  "test-13log-public-category",
  "test-13log-public-timeline-category",
  "test-13log-public-route-category",
  "test-13log-likes-category",
  "test-13log-likes-api-category",
  "test-13log-comments-category",
  "test-13log-comments-api-category",
  "test-13log-admin-category",
  "test-13log-admin-empty-category",
  "test-13log-cleanup-category",
];

export const TEST_TAG_SLUGS = [
  "test-13log-tag-backend",
  "test-13log-tag-database",
  "test-13log-tag-draft",
  "test-13log-tag-published",
  "test-13log-tag-release",
  "test-13log-tag-mood",
  "test-13log-tag-timeline",
  "test-13log-tag-likes",
  "test-13log-tag-comments",
  "test-13log-tag-route",
  "test-13log-tag-admin",
  "test-13log-tag-api",
  "test-13log-tag-unused",
  "test-13log-tag-match",
  "test-13log-tag-other",
  "test-13log-tag-cleanup",
];

export const TEST_MICRO_POST_CONTENTS = [
  "[test-13log] repository-draft",
  "[test-13log] repository-published",
  "[test-13log] repository-updated",
  "[test-13log] likes-repository",
  "[test-13log] public-timeline-published",
  "[test-13log] public-timeline-draft",
  "[test-13log] public-timeline-image\n\n![alt](/images/test.jpg)",
  "[test-13log] public-rich\n\n第一行\n第二行\n\n- 列表项",
  "[test-13log] public-filter-match\n\n筛选命中的 rich micro\n\n- 列表项",
  "[test-13log] public-filter-other\n\n筛选外的 rich micro\n\n- 列表项",
  "[test-13log] likes-api",
  "[test-13log] cleanup-integration",
];

export const TEST_GUESTBOOK_NICKNAMES = [
  "test-13log-guestbook-repository-user",
  "test-13log-guestbook-repository-delete",
  "test-13log-guestbook-api-user",
  "test-13log-guestbook-cleanup",
];

export async function cleanupTestData(db) {
  await db.microPostTag.deleteMany({
    where: {
      microPost: {
        content: {
          in: TEST_MICRO_POST_CONTENTS,
        },
      },
    },
  });

  await db.microPost.deleteMany({
    where: {
      content: {
        in: TEST_MICRO_POST_CONTENTS,
      },
    },
  });

  await db.comment.deleteMany({
    where: {
      post: {
        slug: {
          in: TEST_SLUGS,
        },
      },
    },
  });

  await db.postLike.deleteMany({
    where: {
      post: {
        slug: {
          in: TEST_SLUGS,
        },
      },
    },
  });

  await db.postTag.deleteMany({
    where: {
      post: {
        slug: {
          in: TEST_SLUGS,
        },
      },
    },
  });

  await db.post.deleteMany({
    where: {
      slug: {
        in: TEST_SLUGS,
      },
    },
  });

  await db.guestbookEntry.deleteMany({
    where: {
      nickname: {
        in: TEST_GUESTBOOK_NICKNAMES,
      },
    },
  });

  await db.tag.deleteMany({
    where: {
      slug: {
        in: TEST_TAG_SLUGS,
      },
    },
  });

  await db.category.deleteMany({
    where: {
      slug: {
        in: TEST_CATEGORY_SLUGS,
      },
    },
  });
}

async function defaultLoadPrisma() {
  const { PrismaClient } = await import("@prisma/client");
  return PrismaClient;
}

export async function main({ env = process.env, loadPrisma = defaultLoadPrisma } = {}) {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const previousDirectUrl = process.env.DIRECT_URL;

  try {
    const testDatabaseUrl = resolveTestDatabaseEnv(env);

    process.env.DATABASE_URL = testDatabaseUrl;
    process.env.DIRECT_URL = testDatabaseUrl;

    const PrismaClient = await loadPrisma();
    const db = new PrismaClient();
    let cleanupError;
    let disconnectError;

    try {
      await cleanupTestData(db);
    } catch (error) {
      cleanupError = error;
    }

    try {
      await db.$disconnect();
    } catch (error) {
      disconnectError = error;
    }

    if (cleanupError) {
      if (disconnectError) {
        console.error(
          "Failed to disconnect the isolated test database after cleanup failed.",
          disconnectError
        );
      }
      throw cleanupError;
    }

    if (disconnectError) {
      throw disconnectError;
    }

    console.log("Cleaned exact test-13log fixtures.");
  } finally {
    restoreEnv("DATABASE_URL", previousDatabaseUrl);
    restoreEnv("DIRECT_URL", previousDirectUrl);
  }
}

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
