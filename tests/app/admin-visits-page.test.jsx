import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../../lib/repositories/access-audit", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAccessAuditPageData: vi.fn(async () => ({
      filters: {
        from: "2026-03-20",
        to: "2026-03-27",
        riskLabel: "suspicious",
        blockReason: "",
        country: "CA",
        path: "/posts",
        onlyFlagged: true,
      },
      summary: {
        todayCount: 12,
        last7DaysCount: 48,
        topPages: [
          { path: "/posts", count: 9 },
          { path: "/about", count: 5 },
        ],
      },
      riskSummary: {
        normal: 9,
        suspicious: 4,
        bot: 2,
        blocked: 6,
      },
      rows: [
        {
          id: "log-1",
          path: "/posts/this-path-is-long-enough-to-overflow-the-table-cell",
          country: "CA",
          region: "Ontario",
          city: "Guelph",
          riskLabel: "suspicious",
          riskScore: 40,
          blockReason: "rate_limit",
          referer: "https://google.com/very/long/referer/for/admin/audit/testing",
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36",
          blacklistReason: "bot_threshold",
          createdAt: new Date("2026-03-16T16:00:00.000Z"),
        },
      ],
    })),
  };
});

import AdminVisitsPage from "../../app/admin/(protected)/visits/page.jsx";

describe("admin visits page", () => {
  it("renders audit summaries, filters, and risk rows", async () => {
    const markup = renderToStaticMarkup(await AdminVisitsPage({
      searchParams: Promise.resolve({
        onlyFlagged: "true",
      }),
    }));

    expect(markup).toContain("Visits");
    expect(markup).toContain("Today PV");
    expect(markup).toContain("Last 7 Days");
    expect(markup).toContain("Normal");
    expect(markup).toContain("Suspicious");
    expect(markup).toContain("Bot");
    expect(markup).toContain("Blocked");
    expect(markup).toContain("Only flagged traffic");
    expect(markup).toContain("Risk Label");
    expect(markup).toContain("Block Reason");
    expect(markup).toContain("admin-audit-table-scroll");
    expect(markup).toContain("admin-audit-cell--truncate");
    expect(markup).toContain('title="/posts/this-path-is-long-enough-to-overflow-the-table-cell"');
    expect(markup).toContain('title="https://google.com/very/long/referer/for/admin/audit/testing"');
    expect(markup).toContain("admin-audit-badge");
    expect(markup).toContain("admin-audit-badge--warn");
    expect(markup).toContain("admin-audit-badge--danger");
    expect(markup).toContain("rate_limit");
    expect(markup).toContain("bot_threshold");
    expect(markup).toContain("Risk Score");
    expect(markup).toContain("Location");
    expect(markup).toContain("CA / Ontario / Guelph");
    expect(markup).toContain('title="CA / Ontario / Guelph"');
    expect(markup).toContain("Chrome/142.0.0.0");
  });
});
