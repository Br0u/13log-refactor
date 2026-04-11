import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("header nav photos link", () => {
  it("points the Photos navigation item at the site-native photos index", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/components/HeaderNav.js"), "utf8");

    expect(source).toContain('{ href: "/photos", label: "Photos" }');
    expect(source).not.toContain('{ href: "/photos/index.html", label: "Photos" }');
  });

  it("adds Playzone to the primary navigation", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/components/HeaderNav.js"), "utf8");

    expect(source).toContain('{ href: "/playzone", label: "Playzone" }');
  });

  it("adds Playzone to the primary navigation", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/components/HeaderNav.js"), "utf8");

    expect(source).toContain('{ href: "/playzone", label: "Playzone" }');
  });

  it("disables link prefetching to avoid inflating visit logs", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/components/HeaderNav.js"), "utf8");

    expect(source).toContain("prefetch={false}");
  });
});
