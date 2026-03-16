import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdminLayout from "../../app/admin/layout";

describe("admin layout", () => {
  it("renders the workspace rail and stage navigation shell", async () => {
    const markup = renderToStaticMarkup(
      await AdminLayout({
        children: "<div>content</div>",
      })
    );

    expect(markup).toContain("admin-shell admin-shell--latin admin-shell--flex");
    expect(markup).toContain("admin-shell__rail");
    expect(markup).toContain("admin-shell__stage");
    expect(markup).toContain("admin-shell__rail-header");
    expect(markup).toContain("admin-shell__rail-footer");
    expect(markup).toContain("/admin/posts");
    expect(markup).toContain("/admin/categories");
    expect(markup).toContain("/admin/tags");
    expect(markup).toContain("/admin/comments");
  });

  it("removes the blog main-width constraint when the main container contains admin shells", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

    expect(stylesheet).toMatch(/\.main:has\(\.admin-shell\)/);
    expect(stylesheet).toMatch(/\.main:has\(\.admin-shell\)[^{]*\{[^}]*max-width:\s*none;/s);
    expect(stylesheet).toMatch(/\.main:has\(\.admin-shell\)[^{]*\{[^}]*padding-inline:\s*0;/s);
  });
});
