import { describe, expect, it } from "vitest";
import {
  clearAdminSession,
  createAdminSession,
  hashPassword,
  readAdminSession,
  verifyPassword,
} from "../../lib/auth";

describe("auth helpers", () => {
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
});
