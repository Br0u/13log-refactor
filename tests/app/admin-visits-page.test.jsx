import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../../lib/repositories/visit-logs", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    listRecentVisitLogs: vi.fn(async () => ([
      {
        id: "visit-1",
        path: "/posts",
        referer: "https://google.com",
        ipSummary: "203.0.113.x",
        country: "Canada",
        region: "Ontario",
        city: "Guelph",
        userAgent: "Mozilla/5.0",
        createdAt: new Date("2026-03-16T16:00:00.000Z"),
      },
    ])),
    getVisitLogSummary: vi.fn(async () => ({
      todayCount: 12,
      last7DaysCount: 48,
      topPages: [
        { path: "/posts", count: 9 },
        { path: "/about", count: 5 },
      ],
    })),
  };
});

import AdminVisitsPage from "../../app/admin/visits/page.jsx";

describe("admin visits page", () => {
  it("renders visit summaries and recent visit rows", async () => {
    const markup = renderToStaticMarkup(await AdminVisitsPage());

    expect(markup).toContain("Visits");
    expect(markup).toContain("Today PV");
    expect(markup).toContain("Last 7 Days");
    expect(markup).toContain("/posts");
    expect(markup).toContain("https://google.com");
    expect(markup).toContain("Canada / Ontario / Guelph");
  });
});
