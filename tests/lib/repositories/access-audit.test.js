import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  countMock,
  groupByMock,
  findManyMock,
  blacklistFindManyMock,
} = vi.hoisted(() => ({
  countMock: vi.fn(),
  groupByMock: vi.fn(),
  findManyMock: vi.fn(),
  blacklistFindManyMock: vi.fn(),
}));

vi.mock("../../../lib/db", () => ({
  db: {
    accessLog: {
      count: countMock,
      groupBy: groupByMock,
      findMany: findManyMock,
    },
    blacklist: {
      findMany: blacklistFindManyMock,
    },
  },
}));

import {
  buildAccessAuditFilters,
  getAccessAuditPageData,
} from "../../../lib/repositories/access-audit";

describe("access audit repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds a filtered where clause with onlyFlagged support", () => {
    const filters = buildAccessAuditFilters({
      from: "2026-03-20",
      to: "2026-03-27",
      riskLabel: "normal",
      blockReason: "rate_limit",
      country: "CA",
      path: "/api",
      onlyFlagged: "true",
    });

    expect(filters.where.riskLabel).toEqual({
      in: ["suspicious", "bot"],
    });
    expect(filters.where.blockReason).toBe("rate_limit");
    expect(filters.where.country).toBe("CA");
    expect(filters.where.path).toEqual({
      contains: "/api",
      mode: "insensitive",
    });
    expect(filters.where.createdAt.gte).toBeInstanceOf(Date);
    expect(filters.where.createdAt.lte).toBeInstanceOf(Date);
  });

  it("loads summary cards, risk cards, rows, and blacklist state from access logs", async () => {
    countMock
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(48)
      .mockResolvedValueOnce(9)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(6);

    groupByMock.mockResolvedValueOnce([
      { path: "/posts", _count: { path: 9 } },
      { path: "/about", _count: { path: 5 } },
    ]);

    findManyMock.mockResolvedValueOnce([
      {
        id: "log-1",
        ipHash: "hash-1",
        path: "/posts",
        country: "CA",
        region: "Ontario",
        city: "Guelph",
        riskLabel: "suspicious",
        riskScore: 40,
        blockReason: null,
        referer: "https://google.com",
        userAgent: "Mozilla/5.0",
        createdAt: new Date("2026-03-27T16:00:00.000Z"),
      },
    ]);

    blacklistFindManyMock.mockResolvedValueOnce([
      { ipHash: "hash-1", reason: "bot_threshold" },
    ]);

    const data = await getAccessAuditPageData({
      onlyFlagged: "true",
    });

    expect(data.summary.todayCount).toBe(12);
    expect(data.summary.last7DaysCount).toBe(48);
    expect(data.summary.topPages[0]).toEqual({ path: "/posts", count: 9 });
    expect(data.riskSummary).toEqual({
      normal: 9,
      suspicious: 4,
      bot: 2,
      blocked: 6,
    });
    expect(data.rows[0]).toMatchObject({
      path: "/posts",
      riskLabel: "suspicious",
      riskScore: 40,
      blacklistReason: "bot_threshold",
    });
    expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        riskLabel: { in: ["suspicious", "bot"] },
      }),
      take: 100,
    }));
  });
});
