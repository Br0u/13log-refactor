import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findBlacklistByIpHashMock,
  countRecentAccessLogsMock,
  createAccessLogMock,
  countBotAccessLogsMock,
  upsertBlacklistMock,
} = vi.hoisted(() => ({
  findBlacklistByIpHashMock: vi.fn(),
  countRecentAccessLogsMock: vi.fn(),
  createAccessLogMock: vi.fn(),
  countBotAccessLogsMock: vi.fn(),
  upsertBlacklistMock: vi.fn(),
}));

vi.mock("../../../lib/repositories/access-logs", () => ({
  findBlacklistByIpHash: findBlacklistByIpHashMock,
  countRecentAccessLogs: countRecentAccessLogsMock,
  createAccessLog: createAccessLogMock,
  countBotAccessLogs: countBotAccessLogsMock,
  upsertBlacklist: upsertBlacklistMock,
}));

import { POST as riskPostRoute } from "../../../app/api/internal/risk/route";
import { signInternalRiskBody } from "../../../lib/internal-risk-auth";

const RISK_SECRET = "risk-secret-that-is-at-least-32-characters";
const SESSION_SECRET = "session-secret-that-is-at-least-32-characters";

async function signedRiskRequest(payload: unknown) {
  const body = JSON.stringify(payload);
  const signed = await signInternalRiskBody(body, Date.now());

  return new Request("http://localhost:3000/api/internal/risk", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-risk-timestamp": signed.timestamp,
      "x-risk-signature": signed.signature,
    },
    body,
  });
}

function expectNoRepositoryCalls() {
  expect(findBlacklistByIpHashMock).not.toHaveBeenCalled();
  expect(countRecentAccessLogsMock).not.toHaveBeenCalled();
  expect(createAccessLogMock).not.toHaveBeenCalled();
  expect(countBotAccessLogsMock).not.toHaveBeenCalled();
  expect(upsertBlacklistMock).not.toHaveBeenCalled();
}

describe("internal risk api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("RISK_INTERNAL_SECRET", RISK_SECRET);
    vi.stubEnv("SESSION_SECRET", SESSION_SECRET);
    findBlacklistByIpHashMock.mockResolvedValue(null);
    countRecentAccessLogsMock.mockResolvedValue(0);
    createAccessLogMock.mockResolvedValue({ id: "log-1" });
    countBotAccessLogsMock.mockResolvedValue(0);
    upsertBlacklistMock.mockResolvedValue({ id: "blacklist-1" });
  });

  it("blocks blacklisted traffic before anything else", async () => {
    findBlacklistByIpHashMock.mockResolvedValueOnce({ id: "blacklist-1", ipHash: "abc" });

    const response = await riskPostRoute(await signedRiskRequest({
        ipHash: "abc",
        path: "/admin",
        country: "CA",
        region: "Ontario",
        city: "Guelph",
        userAgent: "Mozilla/5.0",
        referer: "https://example.com",
        riskScore: 0,
        riskLabel: "normal",
        ipSummary: "203.0.113.x",
      }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      action: "block",
      status: 403,
      reason: "blacklist",
    });
    expect(createAccessLogMock).toHaveBeenCalledWith(expect.objectContaining({
      ipHash: "abc",
      ipSummary: "203.0.113.x",
      isBlocked: true,
      blockReason: "blacklist",
    }));
    expect(countRecentAccessLogsMock).not.toHaveBeenCalled();
  });

  it("blocks rate-limited traffic with 429", async () => {
    countRecentAccessLogsMock.mockResolvedValueOnce(20);

    const response = await riskPostRoute(await signedRiskRequest({
        ipHash: "rate-limit",
        path: "/api/comments",
        country: "CA",
        region: "Ontario",
        city: "Guelph",
        userAgent: "Mozilla/5.0",
        referer: "https://example.com",
        riskScore: 10,
        riskLabel: "normal",
        ipSummary: "203.0.113.x",
      }));

    expect(await response.json()).toEqual({
      action: "block",
      status: 429,
      reason: "rate_limit",
    });
    expect(createAccessLogMock).toHaveBeenCalledWith(expect.objectContaining({
      ipHash: "rate-limit",
      ipSummary: "203.0.113.x",
      isBlocked: true,
      blockReason: "rate_limit",
    }));
  });

  it("does not apply rate limiting to public page traffic", async () => {
    countRecentAccessLogsMock.mockResolvedValueOnce(999);

    const response = await riskPostRoute(await signedRiskRequest({
        ipHash: "public-page",
        path: "/posts",
        country: "CA",
        region: "Ontario",
        city: "Guelph",
        userAgent: "Mozilla/5.0",
        referer: "https://example.com",
        riskScore: 0,
        riskLabel: "normal",
        ipSummary: "203.0.113.x",
      }));

    expect(await response.json()).toEqual({
      action: "allow",
      status: 200,
      reason: "logged",
    });
    expect(countRecentAccessLogsMock).not.toHaveBeenCalled();
    expect(createAccessLogMock).toHaveBeenCalledWith(expect.objectContaining({
      ipHash: "public-page",
      ipSummary: "203.0.113.x",
      path: "/posts",
      isBlocked: false,
      blockReason: null,
    }));
  });

  it("does not apply rate limiting to admin pages", async () => {
    countRecentAccessLogsMock.mockResolvedValueOnce(999);

    const response = await riskPostRoute(await signedRiskRequest({
        ipHash: "admin-page",
        path: "/admin/visits",
        country: "CA",
        region: "Ontario",
        city: "Guelph",
        userAgent: "Mozilla/5.0",
        referer: "https://example.com",
        riskScore: 0,
        riskLabel: "normal",
        ipSummary: "203.0.113.x",
      }));

    expect(await response.json()).toEqual({
      action: "allow",
      status: 200,
      reason: "logged",
    });
    expect(countRecentAccessLogsMock).not.toHaveBeenCalled();
    expect(createAccessLogMock).toHaveBeenCalledWith(expect.objectContaining({
      ipHash: "admin-page",
      ipSummary: "203.0.113.x",
      path: "/admin/visits",
      isBlocked: false,
      blockReason: null,
    }));
  });

  it("blocks bot traffic and escalates repeat offenders into the blacklist", async () => {
    countBotAccessLogsMock.mockResolvedValueOnce(3);

    const response = await riskPostRoute(await signedRiskRequest({
        ipHash: "bot-ip",
        path: "/posts",
        country: "CN",
        region: "",
        city: "",
        userAgent: "python-requests/2.32.3",
        referer: "",
        riskScore: 85,
        riskLabel: "bot",
        ipSummary: "203.0.113.x",
      }));

    expect(await response.json()).toEqual({
      action: "block",
      status: 403,
      reason: "bot",
    });
    expect(createAccessLogMock).toHaveBeenCalledWith(expect.objectContaining({
      ipHash: "bot-ip",
      ipSummary: "203.0.113.x",
      riskLabel: "bot",
      isBlocked: true,
      blockReason: "bot",
    }));
    expect(upsertBlacklistMock).toHaveBeenCalledWith("bot-ip", "bot_threshold", "risk_control");
  });

  it("allows suspicious traffic after logging it", async () => {
    const response = await riskPostRoute(await signedRiskRequest({
        ipHash: "suspicious-ip",
        path: "/posts",
        country: "CA",
        region: "",
        city: "",
        userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36",
        referer: "",
        riskScore: 35,
        riskLabel: "suspicious",
        ipSummary: "203.0.113.x",
      }));

    expect(await response.json()).toEqual({
      action: "allow",
      status: 200,
      reason: "logged",
    });
    expect(createAccessLogMock).toHaveBeenCalledWith(expect.objectContaining({
      ipHash: "suspicious-ip",
      ipSummary: "203.0.113.x",
      riskLabel: "suspicious",
      isBlocked: false,
      blockReason: null,
    }));
  });

  it("allows ordinary browser traffic from any country when no other risk signals exist", async () => {
    const response = await riskPostRoute(await signedRiskRequest({
        ipHash: "cn-human",
        path: "/posts",
        country: "CN",
        region: "Guangdong",
        city: "Shenzhen",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
        referer: "https://example.com",
        riskScore: 5,
        riskLabel: "normal",
        ipSummary: "203.0.113.x",
      }));

    expect(await response.json()).toEqual({
      action: "allow",
      status: 200,
      reason: "logged",
    });
    expect(createAccessLogMock).toHaveBeenCalledWith(expect.objectContaining({
      ipHash: "cn-human",
      ipSummary: "203.0.113.x",
      riskLabel: "normal",
      isBlocked: false,
      blockReason: null,
    }));
  });

  it.each([
    ["missing signature", { timestamp: String(Date.now()) }],
    ["missing timestamp", { signature: "a".repeat(64) }],
    ["malformed timestamp", { timestamp: "not-a-number", signature: "a".repeat(64) }],
    ["invalid hex", { timestamp: String(Date.now()), signature: "not-hex" }],
  ])("returns 403 with zero repository calls for %s", async (_label, auth) => {
    const body = JSON.stringify({
      ipHash: "unauthenticated",
      ipSummary: "203.0.113.x",
      path: "/posts",
      riskScore: 0,
      riskLabel: "normal",
    });
    const response = await riskPostRoute(new Request("http://localhost:3000/api/internal/risk", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...("timestamp" in auth && auth.timestamp
          ? { "x-risk-timestamp": auth.timestamp }
          : {}),
        ...("signature" in auth && auth.signature
          ? { "x-risk-signature": auth.signature }
          : {}),
      },
      body,
    }));

    expect(response.status).toBe(403);
    expectNoRepositoryCalls();
  });

  it("verifies the raw body before parsing JSON", async () => {
    const body = "{not-json";
    const signed = await signInternalRiskBody(body, Date.now());
    const changedSignature = `${signed.signature[0] === "0" ? "1" : "0"}${signed.signature.slice(1)}`;
    const response = await riskPostRoute(new Request("http://localhost:3000/api/internal/risk", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-risk-timestamp": signed.timestamp,
        "x-risk-signature": changedSignature,
      },
      body,
    }));

    expect(response.status).toBe(403);
    expectNoRepositoryCalls();
  });

  it.each([
    ["missing", undefined, SESSION_SECRET],
    ["short", "too-short", SESSION_SECRET],
    ["same as SESSION_SECRET", SESSION_SECRET, SESSION_SECRET],
  ])("returns 403 with zero repository calls when risk secret is %s", async (
    _label,
    riskSecret,
    sessionSecret,
  ) => {
    vi.stubEnv("RISK_INTERNAL_SECRET", RISK_SECRET);
    const body = JSON.stringify({
      ipHash: "bad-config",
      ipSummary: "203.0.113.x",
      path: "/posts",
      riskScore: 0,
      riskLabel: "normal",
    });
    const signed = await signInternalRiskBody(body, Date.now());
    vi.stubEnv("RISK_INTERNAL_SECRET", riskSecret);
    vi.stubEnv("SESSION_SECRET", sessionSecret);

    const response = await riskPostRoute(new Request("http://localhost:3000/api/internal/risk", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-risk-timestamp": signed.timestamp,
        "x-risk-signature": signed.signature,
      },
      body,
    }));

    expect(response.status).toBe(403);
    expectNoRepositoryCalls();
  });
});
