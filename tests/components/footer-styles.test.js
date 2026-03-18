import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("footer styles", () => {
  it("adds an editorial badge layout to the global footer", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.footer\s*\{[^}]*display:\s*grid;/s);
    expect(stylesheet).toMatch(/\.footer\s*\{[^}]*border-top:\s*1px\s+solid\s+[^;]+;/s);
    expect(stylesheet).toMatch(/\.footer__badges\s*\{[^}]*display:\s*flex;[^}]*justify-content:\s*center;/s);
    expect(stylesheet).toMatch(/\.footer-badge\s*\{[^}]*display:\s*inline-flex;[^}]*flex-direction:\s*column;/s);
    expect(stylesheet).toMatch(/\.footer-badge__plate\s*\{[^}]*border:\s*1(?:\.\d+)?px\s+solid\s+[^;]+;/s);
    expect(stylesheet).toMatch(/\.footer__meta\s*\{[^}]*color:\s*[^;]+;/s);
  });

  it("stacks footer badges on small screens", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*\.footer__badges\s*\{[^}]*flex-direction:\s*column;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*\.footer-badge\s*\{[^}]*width:\s*min\(/s);
  });
});
