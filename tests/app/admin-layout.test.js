import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import AdminLayout from "../../app/admin/layout";

describe("admin layout", () => {
  it("renders children without wrapping login routes in the protected workspace shell", async () => {
    const markup = renderToStaticMarkup(
      await AdminLayout({
        children: "<div>content</div>",
      })
    );

    expect(markup).toContain("content");
    expect(markup).not.toContain("admin-shell__rail");
  });

  it("removes the blog main-width constraint when the main container contains admin shells", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

    expect(stylesheet).toMatch(/\.main:has\(\.admin-shell\)/);
    expect(stylesheet).toMatch(/\.main:has\(\.admin-shell\)[^{]*\{[^}]*max-width:\s*none;/s);
    expect(stylesheet).toMatch(/\.main:has\(\.admin-shell\)[^{]*\{[^}]*padding-inline:\s*0;/s);
  });

  it("uses dynamic viewport height for the admin login shell", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

    expect(stylesheet).toMatch(/\.admin-login-shell\s*\{[^}]*min-height:\s*calc\(100vh\s*-\s*var\(--header-height\)\s*-\s*2rem\);[^}]*min-height:\s*calc\(100dvh\s*-\s*var\(--header-height\)\s*-\s*2rem\);/s);
  });
});
