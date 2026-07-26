import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildSessionCookie,
  createAdminSession,
  readAdminSession,
} from "../../lib/session";

const TEST_SESSION_SECRET = "test-session-secret-that-is-at-least-32-characters";
const SESSION_LIFETIME_SECONDS = 8 * 60 * 60;
const NOW = new Date("2026-01-01T00:00:00.000Z");

function decodePayload(token) {
  const [payload] = token.split(".");
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4 || 4)) % 4)}`;
  return JSON.parse(new TextDecoder().decode(
    Uint8Array.from(atob(padded), (character) => character.charCodeAt(0))
  ));
}

function encodePayload(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

describe("admin sessions", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_SECRET", TEST_SESSION_SECRET);
    vi.stubEnv("NODE_ENV", "test");
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each([
    ["missing", ""],
    ["short", "short-session-secret"],
  ])("rejects session creation when SESSION_SECRET is %s", async (_label, secret) => {
    vi.stubEnv("SESSION_SECRET", secret);

    await expect(createAdminSession({ username: "admin" })).rejects.toThrow(
      /SESSION_SECRET.*32/
    );
  });

  it.each([
    ["missing", ""],
    ["short", "short-session-secret"],
  ])("fails closed when reading a session with a %s SESSION_SECRET", async (_label, secret) => {
    const token = await createAdminSession({ username: "admin" });
    vi.stubEnv("SESSION_SECRET", secret);

    await expect(readAdminSession(token)).resolves.toBeNull();
  });

  it("creates a signed payload with an exact eight-hour lifetime", async () => {
    const token = await createAdminSession({ username: "admin" });
    const issuedAt = Math.floor(NOW.getTime() / 1000);

    expect(decodePayload(token)).toEqual({
      username: "admin",
      iat: issuedAt,
      exp: issuedAt + SESSION_LIFETIME_SECONDS,
    });
    await expect(readAdminSession(token)).resolves.toEqual({ username: "admin" });
  });

  it("rejects an expired session", async () => {
    const token = await createAdminSession({ username: "admin" });
    vi.setSystemTime(new Date(NOW.getTime() + SESSION_LIFETIME_SECONDS * 1000));

    await expect(readAdminSession(token)).resolves.toBeNull();
  });

  it.each([
    "",
    "not-a-token",
    ".",
    "payload.",
    ".signature",
    "payload.signature.extra",
  ])("rejects malformed token %j", async (token) => {
    await expect(readAdminSession(token)).resolves.toBeNull();
  });

  it("rejects payload tampering", async () => {
    const token = await createAdminSession({ username: "admin" });
    const [, signature] = token.split(".");
    const tamperedPayload = encodePayload({
      ...decodePayload(token),
      username: "attacker",
    });

    await expect(
      readAdminSession(`${tamperedPayload}.${signature}`)
    ).resolves.toBeNull();
  });

  it("rejects deterministic signature tampering", async () => {
    const token = await createAdminSession({ username: "admin" });
    const [payload, signature] = token.split(".");
    const firstCharacter = signature[0] === "a" ? "b" : "a";
    const tamperedSignature = `${firstCharacter}${signature.slice(1)}`;

    await expect(
      readAdminSession(`${payload}.${tamperedSignature}`)
    ).resolves.toBeNull();
  });

  it("uses Web Crypto verification for valid signatures", async () => {
    const verifySpy = vi.spyOn(globalThis.crypto.subtle, "verify");
    const token = await createAdminSession({ username: "admin" });

    await expect(readAdminSession(token)).resolves.toEqual({ username: "admin" });
    expect(verifySpy).toHaveBeenCalledOnce();
  });

  it("builds a development cookie with the session lifetime and required protections", async () => {
    const cookie = buildSessionCookie("signed-token");

    expect(cookie).toContain("admin_session=signed-token");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain(`Max-Age=${SESSION_LIFETIME_SECONDS}`);
    expect(cookie).not.toContain("Secure");
  });

  it("adds Secure to the session cookie in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(buildSessionCookie("signed-token")).toContain("Secure");
  });
});
