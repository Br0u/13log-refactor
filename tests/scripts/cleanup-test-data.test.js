import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaClientMock, prismaConnectMock } = vi.hoisted(() => {
  const prismaConnectMock = vi.fn();
  return {
    prismaClientMock: vi.fn(() => ({ $connect: prismaConnectMock })),
    prismaConnectMock,
  };
});

vi.mock("@prisma/client", () => ({
  PrismaClient: prismaClientMock,
}));

const suiteDatabaseUrl = process.env.DATABASE_URL;
const suiteDirectUrl = process.env.DIRECT_URL;

describe("cleanup test-data boundary", () => {
  beforeEach(() => {
    vi.resetModules();
    prismaClientMock.mockClear();
    prismaConnectMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreTestEnv("DATABASE_URL", suiteDatabaseUrl);
    restoreTestEnv("DIRECT_URL", suiteDirectUrl);
  });

  it("does not construct or connect Prisma while importing selectors", async () => {
    const cleanup = await import("../../scripts/cleanup-test-data.mjs");

    expect(cleanup.TEST_SLUGS.every((slug) => slug.startsWith("test-13log-"))).toBe(true);
    expect(
      cleanup.TEST_CATEGORY_SLUGS.every((slug) => slug.startsWith("test-13log-"))
    ).toBe(true);
    expect(cleanup.TEST_TAG_SLUGS.every((slug) => slug.startsWith("test-13log-"))).toBe(true);
    expect(
      cleanup.TEST_MICRO_POST_CONTENTS.every((content) =>
        content.startsWith("[test-13log]")
      )
    ).toBe(true);
    expect(
      cleanup.TEST_GUESTBOOK_NICKNAMES.every((nickname) =>
        nickname.startsWith("test-13log-")
      )
    ).toBe(true);
    expect(cleanup.TEST_TAG_SLUGS).not.toEqual(
      expect.arrayContaining(["backend", "database", "draft", "api", "admin", "browser"])
    );
    expect(prismaClientMock).not.toHaveBeenCalled();
    expect(prismaConnectMock).not.toHaveBeenCalled();
  });

  it("refuses an unsafe database before loading Prisma or issuing a query", async () => {
    const { main } = await import("../../scripts/cleanup-test-data.mjs");
    const query = vi.fn();
    const prismaFactory = vi.fn(() => ({ post: { deleteMany: query } }));
    const loadPrisma = vi.fn(async () => prismaFactory);

    await expect(
      main({
        env: {
          DATABASE_URL: "postgresql://app:secret@localhost/13log",
          TEST_DATABASE_URL: "",
          TEST_DATABASE_GUARD: "",
        },
        loadPrisma,
      })
    ).rejects.toThrow(/^TEST_DATABASE_URL is required$/);

    expect(loadPrisma).not.toHaveBeenCalled();
    expect(prismaFactory).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
    expect(prismaClientMock).not.toHaveBeenCalled();
    expect(prismaConnectMock).not.toHaveBeenCalled();
  });

  it("installs the guarded URL before loading Prisma and disconnects afterward", async () => {
    const { main } = await import("../../scripts/cleanup-test-data.mjs");
    const calls = [];
    const testUrl = "postgresql://tester:secret@localhost/13log_test";
    const db = cleanupDbMock();
    const loadPrisma = vi.fn(async () => {
      calls.push([process.env.DATABASE_URL, process.env.DIRECT_URL]);
      return vi.fn(() => db);
    });
    process.env.DATABASE_URL = "original-runtime-url";
    process.env.DIRECT_URL = "original-direct-url";

    await main({
      env: {
        DATABASE_URL: "postgresql://app:secret@localhost/13log",
        TEST_DATABASE_URL: testUrl,
        TEST_DATABASE_GUARD: "13log-test-only",
      },
      loadPrisma,
    });

    expect(calls).toEqual([[testUrl, testUrl]]);
    expect(db.$disconnect).toHaveBeenCalledOnce();
    expect(process.env.DATABASE_URL).toBe("original-runtime-url");
    expect(process.env.DIRECT_URL).toBe("original-direct-url");
  });

  it("restores both runtime URLs when Prisma loading fails", async () => {
    const { main } = await import("../../scripts/cleanup-test-data.mjs");
    const loadError = new Error("loader failed");
    process.env.DATABASE_URL = "original-runtime-url";
    process.env.DIRECT_URL = "original-direct-url";

    await expect(
      main({
        env: {
          DATABASE_URL: "postgresql://app:secret@localhost/13log",
          TEST_DATABASE_URL: "postgresql://tester:secret@localhost/13log_test",
          TEST_DATABASE_GUARD: "13log-test-only",
        },
        loadPrisma: vi.fn().mockRejectedValue(loadError),
      })
    ).rejects.toBe(loadError);

    expect(process.env.DATABASE_URL).toBe("original-runtime-url");
    expect(process.env.DIRECT_URL).toBe("original-direct-url");
  });

  it("keeps cleanup as the primary error when disconnect also fails", async () => {
    const { main } = await import("../../scripts/cleanup-test-data.mjs");
    const cleanupError = new Error("cleanup failed");
    const disconnectError = new Error("disconnect failed");
    const db = cleanupDbMock();
    db.microPostTag.deleteMany.mockRejectedValueOnce(cleanupError);
    db.$disconnect.mockRejectedValueOnce(disconnectError);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.DATABASE_URL = "original-runtime-url";
    process.env.DIRECT_URL = "original-direct-url";

    await expect(
      main({
        env: {
          DATABASE_URL: "postgresql://app:secret@localhost/13log",
          TEST_DATABASE_URL: "postgresql://tester:secret@localhost/13log_test",
          TEST_DATABASE_GUARD: "13log-test-only",
        },
        loadPrisma: vi.fn(async () => vi.fn(() => db)),
      })
    ).rejects.toBe(cleanupError);

    expect(db.$disconnect).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to disconnect the isolated test database after cleanup failed.",
      disconnectError
    );
    expect(process.env.DATABASE_URL).toBe("original-runtime-url");
    expect(process.env.DIRECT_URL).toBe("original-direct-url");
  });

  it("serializes the complete database acceptance lifecycle under one transaction lock", () => {
    const source = fs.readFileSync(
      new URL("./cleanup-test-data.integration.test.js", import.meta.url),
      "utf8"
    );

    expect(source).not.toMatch(/\b(?:beforeEach|afterEach)\s*\(/);
    expect(source).toContain(
      '"SELECT pg_advisory_xact_lock($1::int, $2::int)"'
    );
    expect(source).toContain("const ADVISORY_LOCK_KEYS = [13, 1306]");
    expect(source).toContain("...ADVISORY_LOCK_KEYS");
    const transaction = source.indexOf("db.$transaction(");
    const lock = source.indexOf("pg_advisory_xact_lock", transaction);
    const lifecycle = source.indexOf("try {", lock);
    const initialCleanup = source.indexOf("removeExactFixtures(tx", lifecycle);
    const fixtureCreation = source.indexOf("tx.category.create", initialCleanup);
    const cleanup = source.indexOf("cleanupTestData(tx)", fixtureCreation);
    const assertions = source.indexOf("tx.category.findUnique", cleanup);
    const finallyBlock = source.indexOf("finally {", assertions);
    const finalCleanup = source.indexOf("removeExactFixtures(tx", finallyBlock);
    const lifecycleSteps = [
      transaction,
      lock,
      lifecycle,
      initialCleanup,
      fixtureCreation,
      cleanup,
      assertions,
      finallyBlock,
      finalCleanup,
    ];

    expect(lifecycleSteps.every((index) => index >= 0)).toBe(true);
    expect(new Set(lifecycleSteps).size).toBe(lifecycleSteps.length);
    expect(lifecycleSteps).toEqual([...lifecycleSteps].sort((a, b) => a - b));
  });
});

function restoreTestEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

function cleanupDbMock() {
  const deleteMany = vi.fn().mockResolvedValue({ count: 0 });

  return {
    microPostTag: { deleteMany },
    microPost: { deleteMany },
    comment: { deleteMany },
    postLike: { deleteMany },
    postTag: { deleteMany },
    post: { deleteMany },
    tag: { deleteMany },
    category: { deleteMany },
    guestbookEntry: { deleteMany },
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };
}
