import React from "react";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdminDashboardPage from "../../app/admin/page.jsx";

describe("admin dashboard", () => {
  it("renders management overview sections inside the dashboard workspace frame", () => {
    const markup = renderToStaticMarkup(<AdminDashboardPage />);

    expect(markup).toContain("Dashboard");
    expect(markup).toContain("Content Ops");
    expect(markup).toContain("admin-page__panel");
    expect(markup).toContain("admin-dashboard__grid");
    expect(markup).toContain("Open post manager");
    expect(markup).toContain("/admin/micro-posts");
    expect(markup).toContain("/admin/visits");
  });

  it("keeps overview cards shrinkable and link groups wrappable to avoid horizontal overflow", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

    expect(stylesheet).toMatch(/\.admin-overview-card\s*\{[^}]*min-width:\s*0;/s);
    expect(stylesheet).toMatch(/\.admin-overview-card__links\s*\{[^}]*flex-wrap:\s*wrap;/s);
  });
});
