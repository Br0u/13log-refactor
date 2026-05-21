import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("BlogRail", () => {
  it("maps each rail item to a section and treats detail pages as Posts", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "components/blog/BlogRail.jsx"), "utf8");

    expect(source).toContain('{ href: "/posts/", label: "/ posts", section: "posts" }');
    expect(source).toContain('{ href: "/link/", label: "/ Link", section: "link" }');
    expect(source).toContain('{ href: "/photos/", label: "/ Photos", section: "photos" }');
    expect(source).toMatch(/function\s+resolveActiveSection\(variant\)\s*\{[^}]*variant\s*===\s*"detail"[^}]*return\s+"posts";/s);
  });

  it("marks only the matching rail item as active and current", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "components/blog/BlogRail.jsx"), "utf8");

    expect(source).toContain("item.section === activeSection");
    expect(source).toContain('isActive ? " is-active" : ""');
    expect(source).toContain('aria-current={isActive ? "page" : undefined}');
    expect(source).toContain("<RailLink activeSection={activeSection} item={item}");
  });
});
