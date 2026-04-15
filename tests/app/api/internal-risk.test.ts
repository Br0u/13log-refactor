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

describe("internal risk api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findBlacklistByIpHashMock.mockResolvedValue(null);
    countRecentAccessLogsMock.mockResolvedValue(0);
    createAccessLogMock.mockResolvedValue({ id: "log-1" });
    countBotAccessLogsMock.mockResolvedValue(0);
    upsertBlacklistMock.mockResolvedValue({ id: "blacklist-1" });
  });

  it("blocks blacklisted traffic before anything else", async () => {
    findBlacklistByIpHashMock.mockResolvedValueOnce({ id: "blacklist-1", ipHash: "abc" });

    const response = await riskPostRoute(new Request("http://localhost:3000/api/internal/risk", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-risk-internal": "1",
      },
      body: JSON.stringify({
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
      }),
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

    const response = await riskPostRoute(new Request("http://localhost:3000/api/internal/risk", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-risk-internal": "1",
      },
      body: JSON.stringify({
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
      }),
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

    const response = await riskPostRoute(new Request("http://localhost:3000/api/internal/risk", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-risk-internal": "1",
      },
      body: JSON.stringify({
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
      }),
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

    const response = await riskPostRoute(new Request("http://localhost:3000/api/internal/risk", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-risk-internal": "1",
      },
      body: JSON.stringify({
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
      }),
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

    const response = await riskPostRoute(new Request("http://localhost:3000/api/internal/risk", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-risk-internal": "1",
      },
      body: JSON.stringify({
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
      }),
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
    const response = await riskPostRoute(new Request("http://localhost:3000/api/internal/risk", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-risk-internal": "1",
      },
      body: JSON.stringify({
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
      }),
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
    const response = await riskPostRoute(new Request("http://localhost:3000/api/internal/risk", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-risk-internal": "1",
      },
      body: JSON.stringify({
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
      }),
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
});
