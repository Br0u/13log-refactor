import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("blog rail styles", () => {
  it("creates a wider two-column shell for blog pages and collapses it on mobile", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/body:has\(\.blog-layout\)\s*\{[^}]*--blog-shell-width:\s*min\(1100px,\s*calc\(100vw\s*-\s*18rem\)\);/s);
    expect(stylesheet).toMatch(/\.main:has\(\.blog-layout\)\s*\{[^}]*max-width:\s*var\(--blog-shell-width\);/s);
    expect(stylesheet).toMatch(/\.blog-layout\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(13rem,\s*15rem\)\s+minmax\(0,\s*1fr\);/s);
    expect(stylesheet).toMatch(/\.blog-rail\s*\{[^}]*position:\s*sticky;[^}]*top:\s*calc\(var\(--header-height\)\s*\+\s*1\.4rem\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*\.blog-layout\s*\{[^}]*grid-template-columns:\s*1fr;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*\.blog-rail\s*\{[^}]*display:\s*none;/s);
  });

  it("styles the shared rail navigation and contextual sections with quiet separators", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.blog-rail__nav\s*\{[^}]*border-top:\s*1px\s+solid\s+[^;]+;[^}]*border-bottom:\s*1px\s+solid\s+[^;]+;/s);
    expect(stylesheet).toMatch(/\.blog-rail__nav-link\s*\{[^}]*text-transform:\s*uppercase;[^}]*letter-spacing:\s*0\.08em;/s);
    expect(stylesheet).toMatch(/\.blog-rail__section\s*\{[^}]*padding-top:\s*1rem;[^}]*border-top:\s*1px\s+solid\s+[^;]+;/s);
    expect(stylesheet).toMatch(/\.blog-rail__heading\s*\{[^}]*font-weight:\s*720;/s);
    expect(stylesheet).toMatch(/\.blog-rail__related-link:hover,\s*\.blog-rail__related-link:focus-visible\s*\{[^}]*color:\s*var\(--primary\);/s);
  });

  it("repositions the old right-side toc rail into the new blog shell gutter", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/body:has\(\.blog-layout\)\s+\.page-toc-rail\s*\{[^}]*left:\s*calc\(50%\s*\+\s*\(var\(--blog-shell-width\)\s*\/\s*2\)\s*\+\s*1rem\);/s);
    expect(stylesheet).toMatch(/body:has\(\.blog-layout\)\s+\.page-toc-rail\s*\{[^}]*width:\s*min\(13rem,\s*calc\(50vw\s*-\s*\(var\(--blog-shell-width\)\s*\/\s*2\)\s*-\s*1\.5rem\)\);/s);
  });

  it("lets the toc title wrap instead of clipping long text", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.page-toc-rail__title\s*\{[^}]*line-height:\s*1\.35;/s);
    expect(stylesheet).toMatch(/\.page-toc-rail__title\s*\{[^}]*white-space:\s*normal;/s);
    expect(stylesheet).toMatch(/\.page-toc-rail__title\s*\{[^}]*text-wrap:\s*balance;/s);
    expect(stylesheet).toMatch(/\.page-toc-rail:hover\s+\.page-toc-rail__title,\s*\.page-toc-rail:focus-within\s+\.page-toc-rail__title\s*\{[^}]*max-height:\s*3\.2rem;/s);
  });
});
