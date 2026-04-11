import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("footer styles", () => {
  it("adds an editorial badge layout to the global footer", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.footer\s*\{[^}]*display:\s*grid;/s);
    expect(stylesheet).toMatch(/\.footer\s*\{[^}]*border-top:\s*1px\s+solid\s+[^;]+;/s);
    expect(stylesheet).toMatch(/\.footer__badges\s*\{[^}]*display:\s*flex;[^}]*justify-content:\s*center;/s);
    expect(stylesheet).toMatch(/\.footer-badge\s*\{[^}]*--footer-badge-scale:\s*1;[^}]*display:\s*inline-flex;[^}]*flex-direction:\s*column;/s);
    expect(stylesheet).toMatch(/\.footer-badge__image\s*\{[^}]*width:\s*calc\(100px\s*\*\s*var\(--footer-badge-scale\)\);[^}]*height:\s*calc\(35px\s*\*\s*var\(--footer-badge-scale\)\);[^}]*border:\s*calc\(2px\s*\*\s*var\(--footer-badge-scale\)\)\s+solid\s+[^;]+;[^}]*border-top-right-radius:\s*calc\(15px\s*\*\s*var\(--footer-badge-scale\)\);[^}]*border-bottom-left-radius:\s*calc\(15px\s*\*\s*var\(--footer-badge-scale\)\);/s);
    expect(stylesheet).toMatch(/\.footer__meta\s*\{[^}]*color:\s*[^;]+;/s);
  });

  it("keeps footer badges in the same row while scaling them down on small screens", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).not.toMatch(/@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*\.footer__badges\s*\{[^}]*flex-direction:\s*column;/s);
    expect(stylesheet).not.toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.footer-badge__image\s*\{[^}]*width:\s*100%;[^}]*height:\s*auto;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*\.footer__badges\s*\{[^}]*flex-wrap:\s*nowrap;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*\.footer-badge\s*\{[^}]*width:\s*auto;/s);
    expect(stylesheet).toMatch(/\.footer-badge\s*\{[^}]*--footer-badge-scale:\s*1;/s);
    expect(stylesheet).toMatch(/\.footer-badge__image\s*\{[^}]*width:\s*calc\(100px\s*\*\s*var\(--footer-badge-scale\)\);[^}]*height:\s*calc\(35px\s*\*\s*var\(--footer-badge-scale\)\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*\.footer-badge\s*\{[^}]*--footer-badge-scale:\s*0\.[0-9]+;/s);
  });
});
