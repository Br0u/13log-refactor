import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const {
  createMock,
  findManyMock,
} = vi.hoisted(() => ({
  createMock: vi.fn(),
  findManyMock: vi.fn(),
}));

vi.mock("../../../lib/db", () => ({
  db: {
    visitLog: {
      create: createMock,
      findMany: findManyMock,
    },
  },
}));

import { createVisitLog, formatVisitLocation, listRecentVisitLogs } from "../../../lib/repositories/visit-logs";

function createMissingColumnError(column) {
  return new Prisma.PrismaClientKnownRequestError("missing column", {
    code: "P2022",
    clientVersion: "test",
    meta: { column },
  });
}

describe("visit log repository", () => {
  it("falls back to the old insert shape when geolocation columns are missing", async () => {
    createMock
      .mockRejectedValueOnce(createMissingColumnError("VisitLog.country"))
      .mockResolvedValueOnce({ id: "visit-1" });

    await createVisitLog({
      path: "/posts",
      referer: "https://google.com",
      ipSummary: "203.0.113.x",
      country: "Canada",
      region: "Ontario",
      city: "Guelph",
      userAgent: "Mozilla/5.0",
    });

    expect(createMock).toHaveBeenNthCalledWith(2, {
      data: {
        path: "/posts",
        referer: "https://google.com",
        ipSummary: "203.0.113.x",
        userAgent: "Mozilla/5.0",
      },
    });
  });

  it("falls back to the old query shape when geolocation columns are missing", async () => {
    findManyMock
      .mockRejectedValueOnce(createMissingColumnError("VisitLog.country"))
      .mockResolvedValueOnce([
        {
          id: "visit-1",
          path: "/posts",
          referer: "https://google.com",
          ipSummary: "203.0.113.x",
          userAgent: "Mozilla/5.0",
          createdAt: new Date("2026-03-16T16:00:00.000Z"),
        },
      ]);

    const visits = await listRecentVisitLogs();

    expect(visits[0].country).toBeNull();
    expect(visits[0].ipSummary).toBe("203.0.113.x");
  });

  it("formats location from geo fields and falls back to masked ip", () => {
    expect(formatVisitLocation({
      country: "Canada",
      region: "Ontario",
      city: "Guelph",
      ipSummary: "203.0.113.x",
    })).toBe("Canada / Ontario / Guelph");

    expect(formatVisitLocation({
      country: null,
      region: null,
      city: null,
      ipSummary: "203.0.113.x",
    })).toBe("203.0.113.x");
  });
});
