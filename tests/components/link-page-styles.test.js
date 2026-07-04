import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("link page styles", () => {
  it("uses the dedicated ink landscape background without applying it to playzone", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toContain("body:has(.blog-layout--link-index:not(.playzone-layout))");
    expect(stylesheet).toContain('image-set(url("/images/backgrounds/link-ink-bg.webp") type("image/webp"), url("/images/backgrounds/link-ink-bg.png") type("image/png")) center / cover no-repeat fixed');
    expect(stylesheet).toContain("body.dark:has(.blog-layout--link-index:not(.playzone-layout))");
    expect(stylesheet).toContain('image-set(url("/images/backgrounds/link-night-ink-bg.webp") type("image/webp"), url("/images/backgrounds/link-night-ink-bg.png") type("image/png")) center / cover no-repeat fixed');
  });

  it("gives the link page a blue glass treatment in dark mode", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--link-index:not\(\.playzone-layout\)\)\s*\{[^}]*--primary:\s*#dbeaff;[^}]*link-night-ink-bg\.png/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--link-index:not\(\.playzone-layout\)\)\s+\.blog-rail\s*\{[^}]*border-color:\s*rgba\(105,\s*157,\s*226,\s*0\.34\);[^}]*background:[^}]*rgba\(5,\s*12,\s*22,\s*0\.34\);[^}]*box-shadow:[^}]*rgba\(0,\s*0,\s*0,\s*0\.62\)/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--link-index:not\(\.playzone-layout\)\)\s+\.link-essay-entry\s*\{[^}]*border-color:\s*rgba\(105,\s*157,\s*226,\s*0\.36\);[^}]*background:[^}]*rgba\(4,\s*12,\s*24,\s*0\.7\)[^}]*box-shadow:[^}]*rgba\(0,\s*0,\s*0,\s*0\.62\)/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--link-index:not\(\.playzone-layout\)\)\s+\.link-essay-entry__preview\s*\{[^}]*border-color:\s*rgba\(105,\s*157,\s*226,\s*0\.22\);[^}]*opacity:\s*0\.72;[^}]*filter:\s*brightness\(0\.68\)\s+saturate\(0\.74\)\s+contrast\(1\.08\);/s);
  });

  it("turns the link page into a quiet single-column reading flow", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.link-essay-group\s*\{[^}]*display:\s*grid;[^}]*gap:\s*1\.[\d]+rem;/s);
    expect(stylesheet).toMatch(/\.link-essay-list\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);[^}]*gap:\s*clamp\(0\.85rem,/s);
    expect(stylesheet).toMatch(/\.link-essay-entry\s*\{[^}]*padding:\s*clamp\(0\.96rem,[^}]*border:\s*1px\s+solid\s+#000;[^}]*border-radius:\s*0\.35rem;[^}]*background:\s*transparent;[^}]*box-shadow:\s*0\.42rem\s+0\.42rem\s+0\s+#000;/s);
    expect(stylesheet).toMatch(/\.link-essay-entry:not\(:last-child\)::after\s*\{[^}]*content:\s*"\.\.\.";[^}]*text-align:\s*center;/s);
  });

  it("styles link bodies like quiet post excerpts and supports colored inline accents", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.link-essay-entry__body\s*\{[^}]*line-height:\s*1\.[\d]+;[^}]*font-size:\s*0\.[\d]+rem;/s);
    expect(stylesheet).toMatch(/\.link-essay-entry__body\s+a\s*\{[^}]*text-decoration:\s*underline;/s);
    expect(stylesheet).toMatch(/\.link-essay-entry__body\s+a:hover,\s*\.link-essay-entry__body\s+a:focus-visible\s*\{[^}]*color:\s*var\(--primary\);[^}]*background:\s*[^;]+;/s);
    expect(stylesheet).toMatch(/\.link-accent\s*\{[^}]*font-weight:\s*600;[^}]*padding:\s*0\s+0\.2em;/s);
    expect(stylesheet).toMatch(/\.link-accent--sage\s*\{[^}]*color:\s*[^;]+;[^}]*background:\s*[^;]+;/s);
  });

  it("keeps preview images secondary and related links understated", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.link-essay-entry__preview\s*\{[^}]*max-width:\s*11rem;[^}]*opacity:\s*0\.[\d]+;/s);
    expect(stylesheet).toMatch(/\.link-essay-entry__related\s*\{[^}]*border-left:\s*1px\s+solid\s+[^;]+;/s);
    expect(stylesheet).toMatch(/\.link-essay-entry__body\s+a\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*1;/s);
    expect(stylesheet).toMatch(/\.link-essay-entry__related\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*1;/s);
    expect(stylesheet).toMatch(/\.link-essay-entry__related-link:hover,\s*\.link-essay-entry__related-link:focus-visible\s*\{[^}]*color:\s*var\(--primary\);[^}]*transform:\s*translateX\(2px\);/s);
    expect(stylesheet).toMatch(/\.link-essay-entry__preview\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*1;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.link-essay-entry__layout\s*\{[^}]*grid-template-columns:\s*1fr;/s);
  });
});
