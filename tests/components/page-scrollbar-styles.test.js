import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("page scrollbar styles", () => {
  it("does not customize the global page scrollbar", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-base.css"), "utf8");

    expect(stylesheet).not.toMatch(/(^|\n)\s*::-webkit-scrollbar-track\s*\{/);
    expect(stylesheet).not.toMatch(/(^|\n)\s*::-webkit-scrollbar-thumb\s*\{/);
    expect(stylesheet).not.toMatch(/(^|\n)\s*::-webkit-scrollbar:not\(/);
    expect(stylesheet).not.toMatch(/(^|\n)\s*::-webkit-scrollbar\s*\{/);
    expect(stylesheet).not.toMatch(/(^|\n)\s*\.list:not\(\.dark\)::-webkit-scrollbar/);
  });
});
