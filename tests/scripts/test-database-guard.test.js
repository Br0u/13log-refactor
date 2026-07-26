import { describe, expect, it } from "vitest";
import { resolveTestDatabaseEnv } from "../../scripts/lib/test-database-guard.mjs";

describe("resolveTestDatabaseEnv", () => {
  it.each([undefined, "", "  "])(
    "rejects an empty normal database baseline: %j",
    (databaseUrl) => {
      expect(() =>
        resolveTestDatabaseEnv({
          DATABASE_URL: databaseUrl,
          TEST_DATABASE_URL: "postgresql://tester:secret@localhost/13log_test",
          TEST_DATABASE_GUARD: "13log-test-only",
        })
      ).toThrow(/^DATABASE_URL baseline is required$/);
    }
  );

  it.each([undefined, "", "  "])(
    "rejects an empty test database URL: %j",
    (testDatabaseUrl) => {
      expect(() =>
        resolveTestDatabaseEnv({
          DATABASE_URL: "postgresql://app:secret@localhost/13log",
          TEST_DATABASE_URL: testDatabaseUrl,
          TEST_DATABASE_GUARD: "13log-test-only",
        })
      ).toThrow(/^TEST_DATABASE_URL is required$/);
    }
  );

  it.each([undefined, "", "  ", "13log-test-only "])(
    "rejects a guard token other than the exact required value: %j",
    (guard) => {
      expect(() =>
        resolveTestDatabaseEnv({
          DATABASE_URL: "postgresql://app:secret@localhost/13log",
          TEST_DATABASE_URL: "postgresql://tester:secret@localhost/13log_test",
          TEST_DATABASE_GUARD: guard,
        })
      ).toThrow(/TEST_DATABASE_GUARD/);
    }
  );

  it.each([
    "not a url",
    "https://localhost/13log",
    "postgresql://localhost/%ZZ",
    "postgresql:prod",
    "postgresql://u@h",
    "postgresql://u@h/",
  ])(
    "rejects an invalid normal PostgreSQL URL: %s",
    (databaseUrl) => {
      expect(() =>
        resolveTestDatabaseEnv({
          DATABASE_URL: databaseUrl,
          TEST_DATABASE_URL: "postgresql://tester:secret@localhost/13log_test",
          TEST_DATABASE_GUARD: "13log-test-only",
        })
      ).toThrow(/^DATABASE_URL must be a valid PostgreSQL URL$/);
    }
  );

  it.each([
    "not a url",
    "mysql://localhost/13log_test",
    "postgresql://localhost/%ZZ",
    "postgresql:prod",
    "postgresql://u@h",
    "postgresql://u@h/",
  ])(
    "rejects an invalid test PostgreSQL URL: %s",
    (testDatabaseUrl) => {
      expect(() =>
        resolveTestDatabaseEnv({
          DATABASE_URL: "postgresql://app:secret@localhost/13log",
          TEST_DATABASE_URL: testDatabaseUrl,
          TEST_DATABASE_GUARD: "13log-test-only",
        })
      ).toThrow(/^TEST_DATABASE_URL must be a valid PostgreSQL URL$/);
    }
  );

  it("rejects the same database identity after URL normalization", () => {
    expect(() =>
      resolveTestDatabaseEnv({
        DATABASE_URL:
          "postgresql://app:normal-secret@DB.EXAMPLE.COM/%31%33log?schema=public",
        TEST_DATABASE_URL:
          "postgres://tester:test-secret@db.example.com:5432/13log?schema=test",
        TEST_DATABASE_GUARD: "13log-test-only",
      })
    ).toThrow(/^TEST_DATABASE_URL must not match DATABASE_URL$/);
  });

  it("rejects the same database when one hostname uses a DNS trailing dot", () => {
    expect(() =>
      resolveTestDatabaseEnv({
        DATABASE_URL: "postgresql://app:normal@db.example.com/13log",
        TEST_DATABASE_URL:
          "postgresql://tester:test@DB.EXAMPLE.COM.:5432/13log?schema=test",
        TEST_DATABASE_GUARD: "13log-test-only",
      })
    ).toThrow(/^TEST_DATABASE_URL must not match DATABASE_URL$/);
  });

  it.each([
    [
      "database name",
      "postgresql://tester:secret@127.0.0.1:1/13log_test",
    ],
    [
      "hostname",
      "postgresql://tester:secret@test-db.internal:5432/13log",
    ],
    [
      "port",
      "postgresql://tester:secret@localhost:5433/13log",
    ],
  ])(
    "returns the test URL without connecting when the %s is distinct",
    (_difference, testDatabaseUrl) => {
      expect(
        resolveTestDatabaseEnv({
          DATABASE_URL: "postgresql://app:secret@localhost:5432/13log",
          TEST_DATABASE_URL: testDatabaseUrl,
          TEST_DATABASE_GUARD: "13log-test-only",
        })
      ).toBe(testDatabaseUrl);
    }
  );

  it.each([
    [
      "IPv4",
      "postgresql://app:secret@127.0.0.1:5432/13log",
      "postgresql://tester:secret@127.0.0.1:5432/13log_test",
    ],
    [
      "IPv6",
      "postgresql://app:secret@[2001:db8::1]:5432/13log",
      "postgresql://tester:secret@[2001:db8::1]:5432/13log_test",
    ],
  ])(
    "preserves %s host identity while accepting a distinct database name",
    (_addressFamily, databaseUrl, testDatabaseUrl) => {
      expect(
        resolveTestDatabaseEnv({
          DATABASE_URL: databaseUrl,
          TEST_DATABASE_URL: testDatabaseUrl,
          TEST_DATABASE_GUARD: "13log-test-only",
        })
      ).toBe(testDatabaseUrl);
    }
  );
});

describe("database test setup", () => {
  it("guards and installs the verified URL before database tests load", async () => {
    const previousDatabaseUrl = process.env.DATABASE_URL;
    const previousTestDatabaseUrl = process.env.TEST_DATABASE_URL;
    const previousGuard = process.env.TEST_DATABASE_GUARD;
    const previousDirectUrl = process.env.DIRECT_URL;
    const testDatabaseUrl =
      "postgresql://tester:secret@127.0.0.1:1/13log_test";

    try {
      process.env.DATABASE_URL =
        "postgresql://app:secret@127.0.0.1:5432/13log";
      process.env.TEST_DATABASE_URL = testDatabaseUrl;
      process.env.TEST_DATABASE_GUARD = "13log-test-only";
      process.env.DIRECT_URL =
        "postgresql://unverified:secret@production.example/13log";

      await import("../../tests/setup/test-database.mjs?accepted");

      expect(process.env.DATABASE_URL).toBe(testDatabaseUrl);
      expect(process.env.DIRECT_URL).toBe(testDatabaseUrl);
    } finally {
      restoreEnv("DATABASE_URL", previousDatabaseUrl);
      restoreEnv("TEST_DATABASE_URL", previousTestDatabaseUrl);
      restoreEnv("TEST_DATABASE_GUARD", previousGuard);
      restoreEnv("DIRECT_URL", previousDirectUrl);
    }
  });

  it("refuses before replacing either database URL", async () => {
    const previousDatabaseUrl = process.env.DATABASE_URL;
    const previousTestDatabaseUrl = process.env.TEST_DATABASE_URL;
    const previousGuard = process.env.TEST_DATABASE_GUARD;
    const previousDirectUrl = process.env.DIRECT_URL;
    const normalDatabaseUrl =
      "postgresql://app:secret@localhost:5432/13log";
    const originalDirectUrl =
      "postgresql://unverified:secret@production.example/13log";

    try {
      process.env.DATABASE_URL = normalDatabaseUrl;
      process.env.TEST_DATABASE_URL =
        "postgresql://tester:other@LOCALHOST/13log?schema=test";
      process.env.TEST_DATABASE_GUARD = "13log-test-only";
      process.env.DIRECT_URL = originalDirectUrl;

      await expect(
        import("../../tests/setup/test-database.mjs?rejected")
      ).rejects.toThrow(/^TEST_DATABASE_URL must not match DATABASE_URL$/);

      expect(process.env.DATABASE_URL).toBe(normalDatabaseUrl);
      expect(process.env.DIRECT_URL).toBe(originalDirectUrl);
    } finally {
      restoreEnv("DATABASE_URL", previousDatabaseUrl);
      restoreEnv("TEST_DATABASE_URL", previousTestDatabaseUrl);
      restoreEnv("TEST_DATABASE_GUARD", previousGuard);
      restoreEnv("DIRECT_URL", previousDirectUrl);
    }
  });
});

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
