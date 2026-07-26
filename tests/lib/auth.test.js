import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAdminSession,
  createAdminSession,
  hashPassword,
  readAdminSession,
  verifyPassword,
} from "../../lib/auth";

const TEST_SESSION_SECRET = "test-session-secret-that-is-at-least-32-characters";

describe("auth helpers", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_SECRET", TEST_SESSION_SECRET);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("hashes and verifies the admin password", async () => {
    const password = "s3cret-pass";
    const passwordHash = await hashPassword(password);

    expect(passwordHash).not.toBe(password);
    await expect(verifyPassword(password, passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-pass", passwordHash)).resolves.toBe(false);
  });

  it("creates and reads an admin session token", async () => {
    const token = await createAdminSession({ username: "admin" });

    await expect(readAdminSession(token)).resolves.toEqual({ username: "admin" });
  });

  it("clears invalid sessions", async () => {
    await expect(readAdminSession("bad-token")).resolves.toBeNull();
    expect(clearAdminSession()).toBe("");
  });

  it("keeps session helpers edge-compatible by avoiding Buffer", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "lib/session.js"), "utf8");

    expect(source).not.toContain("Buffer.");
  });
});
