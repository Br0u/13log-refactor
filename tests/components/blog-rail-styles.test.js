import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("blog rail styles", () => {
  it("creates a wider two-column shell for blog pages and collapses it on mobile", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/body:has\(\.blog-layout\)\s*\{[^}]*--blog-shell-width:\s*min\(1180px,\s*calc\(100vw\s*-\s*10rem\)\);/s);
    expect(stylesheet).toMatch(/\.main:has\(\.blog-layout\)\s*\{[^}]*max-width:\s*var\(--blog-shell-width\);/s);
    expect(stylesheet).toMatch(/\.blog-layout\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(14rem,\s*16\.25rem\)\s+minmax\(0,\s*1fr\);/s);
    expect(stylesheet).toMatch(/\.blog-rail\s*\{[^}]*position:\s*sticky;[^}]*top:\s*calc\(var\(--header-height\)\s*\+\s*1\.4rem\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*\.blog-layout\s*\{[^}]*grid-template-columns:\s*1fr;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*\.blog-rail\s*\{[^}]*display:\s*none;/s);
  });

  it("styles the shared rail navigation and contextual sections with quiet separators", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.blog-rail__nav\s*\{[^}]*display:\s*grid;[^}]*gap:\s*0;[^}]*border-bottom:\s*1px\s+solid\s+[^;]+;/s);
    expect(stylesheet).toMatch(/\.blog-rail__nav-link\s*\{[^}]*border-radius:\s*0;[^}]*text-transform:\s*uppercase;[^}]*letter-spacing:\s*0;/s);
    expect(stylesheet).toMatch(/\.blog-rail__nav-link\.is-active,\s*\.blog-rail__nav-link\[aria-current="page"\]\s*\{[^}]*background:\s*color-mix\(in srgb,\s*var\(--entry\)\s*38%,\s*transparent\);[^}]*box-shadow:\s*none;/s);
    expect(stylesheet).toMatch(/\.blog-rail__section\s*\{[^}]*padding:\s*1rem\s+0\.12rem\s+0;[^}]*border-top:\s*none;/s);
    expect(stylesheet).toMatch(/\.blog-rail__heading\s*\{[^}]*font-weight:\s*900;/s);
    expect(stylesheet).toMatch(/\.blog-rail__related-link:hover,\s*\.blog-rail__related-link:focus-visible\s*\{[^}]*color:\s*var\(--accent\);/s);
  });

  it("keeps the post detail rail framed like the shared posts rail", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.blog-layout--post-detail\s+\.blog-rail--detail\s*\{[^}]*position:\s*sticky;[^}]*top:\s*calc\(var\(--header-height\)\s*\+\s*1\.4rem\);[^}]*padding:\s*clamp\(0\.9rem,[^}]*border:\s*1px\s+solid\s+#000;[^}]*border-radius:\s*0\.35rem;[^}]*background:\s*transparent;[^}]*box-shadow:\s*0\.42rem\s+0\.42rem\s+0\s+#000;/s);
    expect(stylesheet).toMatch(/\.blog-layout--post-detail\s+\.blog-rail__brand\s*\{[^}]*min-height:\s*0;[^}]*padding:\s*0\s+0\s+0\.82rem;/s);
    expect(stylesheet).toMatch(/\.blog-layout--post-detail\s+\.blog-rail__heading\s*\{[^}]*font-size:\s*0\.94rem;[^}]*line-height:\s*1\.42;[^}]*overflow-wrap:\s*anywhere;/s);
    expect(stylesheet).toMatch(/\.blog-layout--post-detail\s+\.blog-rail__related-link\s*\{[^}]*display:\s*-webkit-box;[^}]*-webkit-line-clamp:\s*2;[^}]*white-space:\s*normal;/s);
  });

  it("renders the posts intro rail as an asymmetrical image card", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.blog-rail__intro-card\s*\{[^}]*border-radius:\s*0\s+3\.8rem\s+0\s+3\.8rem;/s);
    expect(stylesheet).toMatch(/\.blog-rail__intro-card\s*\{[^}]*url\("\/images\/backgrounds\/posts-intro-bg\.jpg"\);/s);
    expect(stylesheet).toMatch(/\.blog-rail__intro-card\s*\{[^}]*background-size:\s*cover;/s);
    expect(stylesheet).toMatch(/\.blog-rail__intro-text\s*\{[^}]*text-align:\s*center;[^}]*letter-spacing:\s*0;/s);
  });

  it("hides the old right-side toc rail on detail pages while preserving the blog gutter fallback", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/body:has\(\.blog-layout\)\s+\.page-toc-rail\s*\{[^}]*left:\s*calc\(50%\s*\+\s*\(var\(--blog-shell-width\)\s*\/\s*2\)\s*\+\s*1rem\);/s);
    expect(stylesheet).toMatch(/body:has\(\.blog-layout\)\s+\.page-toc-rail\s*\{[^}]*width:\s*min\(13rem,\s*calc\(50vw\s*-\s*\(var\(--blog-shell-width\)\s*\/\s*2\)\s*-\s*1\.5rem\)\);/s);
    expect(stylesheet).toMatch(/\.page-toc-rail\s*\{[^}]*max-height:\s*calc\(100vh\s*-\s*var\(--header-height\)\s*-\s*2rem\);[^}]*max-height:\s*calc\(100dvh\s*-\s*var\(--header-height\)\s*-\s*2rem\);/s);
    expect(stylesheet).toMatch(/body:has\(\.blog-layout--post-detail\)\s+\.page-toc-rail\s*\{[^}]*display:\s*none\s*!important;/s);
  });

  it("lets the toc title wrap instead of clipping long text", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.page-toc-rail__title\s*\{[^}]*line-height:\s*1\.35;/s);
    expect(stylesheet).toMatch(/\.page-toc-rail__title\s*\{[^}]*white-space:\s*normal;/s);
    expect(stylesheet).toMatch(/\.page-toc-rail__title\s*\{[^}]*text-wrap:\s*balance;/s);
    expect(stylesheet).toMatch(/\.page-toc-rail:hover\s+\.page-toc-rail__title,\s*\.page-toc-rail:focus-within\s+\.page-toc-rail__title\s*\{[^}]*max-height:\s*3\.2rem;/s);
  });
});
