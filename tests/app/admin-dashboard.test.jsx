import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdminDashboardPage from "../../app/admin/page.jsx";

describe("admin dashboard", () => {
  it("renders management overview sections", () => {
    const markup = renderToStaticMarkup(<AdminDashboardPage />);

    expect(markup).toContain("Dashboard");
    expect(markup).toContain("Content Ops");
    expect(markup).toContain("Open post manager");
  });
});
