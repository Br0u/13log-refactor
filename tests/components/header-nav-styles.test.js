import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("header nav styles", () => {
  it("marks the active top nav item with a bold round dot", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/#menu\s+a\s*\{[^}]*position:\s*relative;/s);
    expect(stylesheet).toMatch(/#menu\s+a::after\s*\{[^}]*content:\s*"";[^}]*position:\s*absolute;[^}]*left:\s*50%;[^}]*bottom:\s*0\.34rem;[^}]*width:\s*0\.44rem;[^}]*height:\s*0\.44rem;[^}]*border-radius:\s*999px;[^}]*box-shadow:\s*none;[^}]*opacity:\s*0;/s);
    expect(stylesheet).toMatch(/#menu\s+a\.active::after,\s*#menu\s+a\[aria-current="page"\]::after\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*translateX\(-50%\)\s+scale\(1\);/s);
    expect(stylesheet).not.toMatch(/#menu\s+a::before\s*\{[^}]*content:\s*"\/";/s);
  });
});
