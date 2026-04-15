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
          ipHash: "hash-a",
          ipSummary: "203.0.113.x",
          path: "/posts/%E6%A0%91",
          country: "CA",
          region: "Ontario",
          city: "Guelph",
          riskLabel: "suspicious",
          riskScore: 40,
          blockReason: "rate_limit",
          referer: "https://google.com/very/long/referer/for/admin/audit/testing",
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36",
          blacklistReason: "bot_threshold",
          locationSummary: {
            primary: "加拿大 / 安大略省 / 圭尔夫",
            secondary: "CA · Ontario · Guelph",
          },
          deviceSummary: {
            primary: "Chrome 142 · macOS 14",
            secondary: "桌面端",
            browser: "Chrome 142",
            os: "macOS 14",
            device: "桌面端",
          },
          createdAt: new Date("2026-03-16T16:00:00.000Z"),
        },
        {
          id: "log-2",
          ipHash: "hash-a",
          ipSummary: "203.0.113.x",
          path: "/about",
          country: "CA",
          region: "Ontario",
          city: "Guelph",
          riskLabel: "normal",
          riskScore: 5,
          blockReason: null,
          referer: "",
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36",
          blacklistReason: null,
          locationSummary: {
            primary: "加拿大 / 安大略省 / 圭尔夫",
            secondary: "CA · Ontario · Guelph",
          },
          deviceSummary: {
            primary: "Chrome 142 · macOS 14",
            secondary: "桌面端",
            browser: "Chrome 142",
            os: "macOS 14",
            device: "桌面端",
          },
          createdAt: new Date("2026-03-16T15:56:00.000Z"),
        },
        {
          id: "log-3",
          ipHash: "hash-a",
          ipSummary: "203.0.113.x",
          path: "/photos",
          country: "CA",
          region: "Ontario",
          city: "Guelph",
          riskLabel: "normal",
          riskScore: 5,
          blockReason: null,
          referer: "",
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
          blacklistReason: null,
          locationSummary: {
            primary: "加拿大 / 安大略省 / 圭尔夫",
            secondary: "CA · Ontario · Guelph",
          },
          deviceSummary: {
            primary: "Safari 18 · iOS 18.3",
            secondary: "手机",
            browser: "Safari 18",
            os: "iOS 18.3",
            device: "手机",
          },
          createdAt: new Date("2026-03-16T15:54:00.000Z"),
        },
        {
          id: "log-4",
          ipHash: "hash-a",
          ipSummary: "203.0.113.x",
          path: "/notes",
          country: "CA",
          region: "Ontario",
          city: "Guelph",
          riskLabel: "normal",
          riskScore: 0,
          blockReason: null,
          referer: "",
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36",
          blacklistReason: null,
          locationSummary: {
            primary: "加拿大 / 安大略省 / 圭尔夫",
            secondary: "CA · Ontario · Guelph",
          },
          deviceSummary: {
            primary: "Chrome 142 · macOS 14",
            secondary: "桌面端",
            browser: "Chrome 142",
            os: "macOS 14",
            device: "桌面端",
          },
          createdAt: new Date("2026-03-16T15:40:00.000Z"),
        },
      ],
    })),
  };
});

import AdminVisitsPage from "../../app/admin/(protected)/visits/page.jsx";

describe("admin visits page", () => {
  it("renders grouped view with richer cluster summaries by default", async () => {
    const markup = renderToStaticMarkup(await AdminVisitsPage({
      searchParams: Promise.resolve({
        onlyFlagged: "true",
      }),
    }));

    expect(markup).toContain("Visits");
    expect(markup).toContain("Today PV");
    expect(markup).toContain("Last 7 Days");
    expect(markup).toContain("Latest 100");
    expect(markup).toContain("Top Pages");
    expect(markup).toContain("Normal");
    expect(markup).toContain("Suspicious");
    expect(markup).toContain("Bot");
    expect(markup).toContain("Blocked");
    expect(markup).toContain("Only flagged traffic");
    expect(markup).toContain("Risk Label");
    expect(markup).toContain("Block Reason");
    expect(markup).toContain("Request");
    expect(markup).toContain("Visitor Context");
    expect(markup).toContain("Risk &amp; Enforcement");
    expect(markup).toContain("Grouped clusters");
    expect(markup).toContain("Raw timeline");
    expect(markup).toContain("view=raw");
    expect(markup).toContain("admin-audit-table-scroll");
    expect(markup).toContain("admin-audit-group");
    expect(markup).toContain("admin-audit-group__summary");
    expect(markup).toContain("2 visits in 10 minutes");
    expect(markup).not.toContain("3 visits in 10 minutes");
    expect(markup).toContain("16:00:00 → 15:56:00");
    expect(markup).toContain("IP 203.0.113.x");
    expect(markup).toContain("Chrome 142 · macOS 14 · 桌面端");
    expect(markup).toContain("Top path /posts/树");
    expect(markup).toContain("1 suspicious · 1 normal");
    expect(markup).toContain("Expand timeline");
    expect(markup).toContain('title="/posts/树"');
    expect(markup).toContain("/posts/树");
    expect(markup).toContain("/about");
    expect(markup).toContain("/photos");
    expect(markup).toContain("/notes");
    expect(markup).toContain("google.com");
    expect(markup).toContain('title="https://google.com/very/long/referer/for/admin/audit/testing"');
    expect(markup).toContain("admin-audit-badge");
    expect(markup).toContain("admin-audit-badge--warn");
    expect(markup).toContain("admin-audit-badge--danger");
    expect(markup).toContain("Score 40");
    expect(markup).toContain("rate_limit");
    expect(markup).toContain("bot_threshold");
    expect(markup).toContain("admin-local-time");
    expect(markup).toContain("加拿大 / 安大略省 / 圭尔夫");
    expect(markup).toContain("CA · Ontario · Guelph");
    expect(markup).toContain("Chrome 142 · macOS 14");
    expect(markup).toContain("Safari 18 · iOS 18.3");
    expect(markup).toContain("桌面端");
    expect(markup).toContain("手机");
    expect(markup).toContain("admin-audit-agent");
    expect(markup).toContain("admin-audit-agent__raw");
    expect(markup).toContain("Chrome/142.0.0.0");
    expect(markup).toContain("当前列表最多展示最近 100 条访问记录。");
    expect(markup).toContain("/about (5)");
  });

  it("renders raw timeline view without collapsible grouping when requested", async () => {
    const markup = renderToStaticMarkup(await AdminVisitsPage({
      searchParams: Promise.resolve({
        onlyFlagged: "true",
        view: "raw",
      }),
    }));

    expect(markup).toContain("view=grouped");
    expect(markup).not.toContain("IP 203.0.113.x");
    expect(markup).not.toContain("2 visits in 10 minutes");
    expect(markup).not.toContain("admin-audit-group__summary");
    expect(markup).toContain("admin-table__row--audit");
    expect(markup).toContain("/posts/树");
    expect(markup).toContain("/about");
    expect(markup).toContain("/photos");
    expect(markup).toContain("/notes");
  });
});
