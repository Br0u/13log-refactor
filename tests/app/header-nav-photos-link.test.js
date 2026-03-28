import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("header nav photos link", () => {
  it("keeps the Photos navigation item pointed at the original flip-book page", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/components/HeaderNav.js"), "utf8");

    expect(source).toContain('{ href: "/photos/index.html", label: "Photos" }');
    expect(source).not.toContain('{ href: "/photos", label: "Photos" }');
  });
});
