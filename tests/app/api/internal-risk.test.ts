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
      isBlocked: true,
      blockReason: "blacklist",
    }));
    expect(countRecentAccessLogsMock).not.toHaveBeenCalled();
  });

  it("blocks rate-limited traffic with 429", async () => {
    countRecentAccessLogsMock.mockResolvedValueOnce(5);

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
      }),
    }));

    expect(await response.json()).toEqual({
      action: "block",
      status: 429,
      reason: "rate_limit",
    });
    expect(createAccessLogMock).toHaveBeenCalledWith(expect.objectContaining({
      ipHash: "rate-limit",
      isBlocked: true,
      blockReason: "rate_limit",
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
        userAgent: "Mozilla/5.0 Chrome/142.0.0.0 Safari/537.36",
        referer: "",
        riskScore: 90,
        riskLabel: "bot",
      }),
    }));

    expect(await response.json()).toEqual({
      action: "block",
      status: 403,
      reason: "bot",
    });
    expect(createAccessLogMock).toHaveBeenCalledWith(expect.objectContaining({
      ipHash: "bot-ip",
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
        region: "Ontario",
        city: "Guelph",
        userAgent: "Mozilla/5.0 Chrome/142.0.0.0 Safari/537.36",
        referer: "",
        riskScore: 40,
        riskLabel: "suspicious",
      }),
    }));

    expect(await response.json()).toEqual({
      action: "allow",
      status: 200,
      reason: "logged",
    });
    expect(createAccessLogMock).toHaveBeenCalledWith(expect.objectContaining({
      ipHash: "suspicious-ip",
      riskLabel: "suspicious",
      isBlocked: false,
      blockReason: null,
    }));
  });
});
