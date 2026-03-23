import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("link page styles", () => {
  it("turns the link page into a quiet single-column reading flow", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.link-essay-group\s*\{[^}]*display:\s*grid;[^}]*gap:\s*1\.[\d]+rem;/s);
    expect(stylesheet).toMatch(/\.link-essay-list\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/s);
    expect(stylesheet).toMatch(/\.link-essay-entry\s*\{[^}]*border-radius:\s*0;[^}]*background:\s*transparent;[^}]*border:\s*none;[^}]*box-shadow:\s*none;/s);
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
