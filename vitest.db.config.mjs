import { defineConfig } from "vitest/config";

export const DATABASE_INTEGRATION_TESTS = [
  "tests/lib/db.test.js",
  "tests/lib/repositories/comments.test.js",
  "tests/lib/repositories/guestbook.test.js",
  "tests/lib/repositories/likes.test.js",
  "tests/lib/repositories/micro-posts.test.js",
  "tests/lib/repositories/posts.test.js",
  "tests/lib/repositories/tags.test.js",
  "tests/lib/public-content.test.js",
  "tests/app/admin-actions.test.js",
  "tests/app/admin-taxonomy-actions.test.js",
  "tests/app/public-content.test.js",
  "tests/app/api/comments.test.js",
  "tests/app/api/guestbook.test.js",
  "tests/app/api/micro-posts-like.test.js",
  "tests/app/api/posts-like.test.js",
  "tests/scripts/cleanup-test-data.integration.test.js",
];

export default defineConfig({
  resolve: {
    extensions: [".mjs", ".jsx", ".js", ".mts", ".ts", ".tsx", ".json"],
  },
  test: {
    fileParallelism: false,
    include: DATABASE_INTEGRATION_TESTS,
    setupFiles: ["./tests/setup/test-database.mjs"],
  },
});
