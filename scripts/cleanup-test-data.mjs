import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

export const TEST_SLUGS = [
  "repository-test-post",
  "repository-update-post",
  "duplicate-slug",
  "public-facade-test-post",
  "public-route-test-post",
  "likes-test-post",
  "likes-api-post",
  "comments-test-post",
  "comments-api-post",
  "admin-actions-post",
  "admin-actions-comment-post",
  "live-validation-post",
];

export const TEST_CATEGORY_SLUGS = [
  "notes",
  "public-test",
  "public-route-test",
  "likes-test",
  "likes-api-test",
  "comments-test",
  "comments-api-test",
  "admin-actions-test",
  "empty-category",
];

export const TEST_TAG_SLUGS = [
  "backend",
  "database",
  "draft",
  "published",
  "release",
  "likes",
  "api",
  "comments",
  "route",
  "admin",
  "unused-tag",
  "validation",
  "browser",
];

async function main() {
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

  console.log("Cleaned test posts, tags, and categories.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(async () => {
      await db.$disconnect();
    })
    .catch(async (error) => {
      console.error(error);
      await db.$disconnect();
      process.exit(1);
    });
}
