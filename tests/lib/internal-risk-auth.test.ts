import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  signInternalRiskBody,
  verifyInternalRiskBody,
} from "../../lib/internal-risk-auth";

const NOW = 1_750_000_000_000;
const RISK_SECRET = "risk-secret-that-is-at-least-32-characters";
const SESSION_SECRET = "session-secret-that-is-at-least-32-characters";
const BODY = '{"ipHash":"abc","path":"/posts"}';

describe("internal risk authentication", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("RISK_INTERNAL_SECRET", RISK_SECRET);
    vi.stubEnv("SESSION_SECRET", SESSION_SECRET);
  });

  it("signs and verifies the exact body with a millisecond timestamp", async () => {
    const signed = await signInternalRiskBody(BODY, NOW);

    expect(signed.timestamp).toBe(String(NOW));
    expect(signed.signature).toMatch(/^[a-f0-9]{64}$/);
    await expect(verifyInternalRiskBody(
      BODY,
      signed.timestamp,
      signed.signature,
      NOW,
    )).resolves.toBe(true);
  });

  it("matches an independent Node.js HMAC-SHA-256 implementation", async () => {
    const expectedSignature = createHmac("sha256", RISK_SECRET)
      .update(`${NOW}.${BODY}`)
      .digest("hex");

    await expect(signInternalRiskBody(BODY, NOW)).resolves.toEqual({
      timestamp: String(NOW),
      signature: expectedSignature,
    });
  });

  it("rejects a signature when one body byte changes", async () => {
    const signed = await signInternalRiskBody(BODY, NOW);

    await expect(verifyInternalRiskBody(
      `${BODY} `,
      signed.timestamp,
      signed.signature,
      NOW,
    )).resolves.toBe(false);
  });

  it("rejects a valid signature when verification uses a different secret", async () => {
    const signed = await signInternalRiskBody(BODY, NOW);
    vi.stubEnv("RISK_INTERNAL_SECRET", "different-risk-secret-that-is-at-least-32-characters");

    await expect(verifyInternalRiskBody(
      BODY,
      signed.timestamp,
      signed.signature,
      NOW,
    )).resolves.toBe(false);
  });

  it("rejects a mutated timestamp inside the allowed window", async () => {
    const signed = await signInternalRiskBody(BODY, NOW);
    const mutatedTimestamp = String(NOW + 1_000);

    await expect(verifyInternalRiskBody(
      BODY,
      mutatedTimestamp,
      signed.signature,
      NOW + 1_000,
    )).resolves.toBe(false);
  });

  it.each([
    "g".repeat(64),
    "a".repeat(63),
    "aa:bb",
  ])("rejects invalid signature hex %s", async (signature) => {
    await expect(verifyInternalRiskBody(
      BODY,
      String(NOW),
      signature,
      NOW,
    )).resolves.toBe(false);
  });

  it.each([
    ["older", NOW - 60_001],
    ["farther in the future", NOW + 60_001],
  ])("rejects a timestamp %s than 60 seconds", async (_label, timestamp) => {
    const signed = await signInternalRiskBody(BODY, timestamp);

    await expect(verifyInternalRiskBody(
      BODY,
      signed.timestamp,
      signed.signature,
      NOW,
    )).resolves.toBe(false);
  });

  it.each([
    [null, "a".repeat(64)],
    [String(NOW), null],
    [null, null],
  ])("rejects missing timestamp or signature", async (timestamp, signature) => {
    await expect(verifyInternalRiskBody(
      BODY,
      timestamp,
      signature,
      NOW,
    )).resolves.toBe(false);
  });

  it.each([
    "",
    "not-a-number",
    "1750000000000.5",
    " 1750000000000",
    "+1750000000000",
  ])("rejects malformed timestamp %j", async (timestamp) => {
    await expect(verifyInternalRiskBody(
      BODY,
      timestamp,
      "a".repeat(64),
      NOW,
    )).resolves.toBe(false);
  });

  it.each([
    ["missing", undefined],
    ["short", "too-short"],
  ])("rejects a %s RISK_INTERNAL_SECRET", async (_label, secret) => {
    vi.stubEnv("RISK_INTERNAL_SECRET", secret);

    await expect(signInternalRiskBody(BODY, NOW)).rejects.toThrow(
      /RISK_INTERNAL_SECRET.*32/,
    );
    await expect(verifyInternalRiskBody(
      BODY,
      String(NOW),
      "a".repeat(64),
      NOW,
    )).resolves.toBe(false);
  });

  it("rejects RISK_INTERNAL_SECRET when it equals SESSION_SECRET", async () => {
    vi.stubEnv("RISK_INTERNAL_SECRET", SESSION_SECRET);

    await expect(signInternalRiskBody(BODY, NOW)).rejects.toThrow(
      /RISK_INTERNAL_SECRET.*SESSION_SECRET/,
    );
    await expect(verifyInternalRiskBody(
      BODY,
      String(NOW),
      "a".repeat(64),
      NOW,
    )).resolves.toBe(false);
  });
});
