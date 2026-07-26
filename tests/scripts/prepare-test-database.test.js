import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  main,
  resolvePrismaExecutable,
} from "../../scripts/prepare-test-database.mjs";

describe("prepare test database", () => {
  it.each([
    ["win32", "../../node_modules/.bin/prisma.cmd"],
    ["darwin", "../../node_modules/.bin/prisma"],
    ["linux", "../../node_modules/.bin/prisma"],
  ])(
    "resolves the repository-local Prisma executable for %s",
    (platform, relativeExecutable) => {
      expect(resolvePrismaExecutable(platform)).toBe(
        fileURLToPath(new URL(relativeExecutable, import.meta.url))
      );
    }
  );

  it("never invokes the migration runner when the database guard rejects", () => {
    const runCommand = vi.fn();

    expect(() =>
      main({
        env: {
          DATABASE_URL: "postgresql://app:secret@localhost/13log",
          TEST_DATABASE_URL: "postgresql://app:secret@localhost/13log",
          TEST_DATABASE_GUARD: "13log-test-only",
        },
        runCommand,
      })
    ).toThrow(/^TEST_DATABASE_URL must not match DATABASE_URL$/);
    expect(runCommand).not.toHaveBeenCalled();
  });

  it("runs the repository-local Prisma migration with only the verified test URL", () => {
    const runCommand = vi.fn(() => ({ status: 0 }));
    const testDatabaseUrl =
      "postgresql://tester:test-secret@localhost:5432/13log_test";
    const env = {
      DATABASE_URL: "postgresql://app:normal-secret@localhost:5432/13log",
      DIRECT_URL: "postgresql://app:normal-secret@localhost:5432/13log",
      TEST_DATABASE_URL: testDatabaseUrl,
      TEST_DATABASE_GUARD: "13log-test-only",
      PRESERVED_ENV: "preserved",
    };

    main({ env, runCommand });

    expect(runCommand).toHaveBeenCalledWith(
      fileURLToPath(new URL("../../node_modules/.bin/prisma", import.meta.url)),
      ["migrate", "deploy"],
      {
        env: {
          ...env,
          DATABASE_URL: testDatabaseUrl,
          DIRECT_URL: testDatabaseUrl,
        },
        shell: false,
        stdio: "inherit",
      }
    );
  });
});

describe("database test configuration", () => {
  it("runs only the exhaustive integration set serially after guarded setup", async () => {
    const { default: config } = await import("../../vitest.db.config.mjs");

    expect(config.test.setupFiles).toEqual([
      "./tests/setup/test-database.mjs",
    ]);
    expect(config.test.fileParallelism).toBe(false);
    expect(config.test.include).toEqual([
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
    ]);
  });

  it("excludes exactly the database integration files from the default suite", async () => {
    const [{ default: defaultConfig }, { DATABASE_INTEGRATION_TESTS }] =
      await Promise.all([
        import("../../vitest.config.mjs"),
        import("../../vitest.db.config.mjs"),
      ]);

    expect(
      defaultConfig.test.exclude.filter((path) => path.startsWith("tests/"))
    ).toEqual(DATABASE_INTEGRATION_TESTS);
    expect(defaultConfig.test.exclude).not.toContain(
      "tests/app/admin-actions-cache.test.js"
    );
  });
});
