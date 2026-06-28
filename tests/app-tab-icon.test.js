import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("app tab icon", () => {
  it("uses the mountain logo svg as the browser tab icon", () => {
    const icon = fs.readFileSync(path.join(process.cwd(), "app/icon.svg"), "utf8");

    expect(icon).toContain('viewBox="0 0 240 240"');
    expect(icon).toContain('r="108"');
    expect(icon).toContain('d="M50 170 L90 125 L125 170 L150 140 L185 170 Z"');
    expect(icon).not.toContain(">13<");
  });
});
