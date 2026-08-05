import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("BlogRail", () => {
  it("maps each rail item to a section and treats detail pages as Posts", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "components/blog/BlogRail.jsx"), "utf8");

    expect(source).toContain('{ href: "/posts/", label: "/ POSTS", section: "posts" }');
    expect(source).toContain('{ href: "/link/", label: "/ LINK", section: "link" }');
    expect(source).toContain('{ href: "/playzone/", label: "/ PLAYZONE", section: "playzone" }');
    expect(source).toContain('{ href: "/photos/", label: "/ PHOTOS", section: "photos" }');
    expect(source).toMatch(/function\s+resolveActiveSection\(variant\)\s*\{[^}]*variant\s*===\s*"detail"[^}]*return\s+"posts";/s);
  });

  it("renders the avatar image in the rail brand", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "components/blog/BlogRail.jsx"), "utf8");

    expect(source).toContain('className="blog-rail__brand-logo"');
    expect(source).toContain('src="/icon.png"');
    expect(source).toContain('alt="" aria-hidden="true"');
  });

  it("marks only the matching rail item as active and current", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "components/blog/BlogRail.jsx"), "utf8");

    expect(source).toContain("item.section === activeSection");
    expect(source).toContain('isActive ? " is-active" : ""');
    expect(source).toContain('aria-current={isActive ? "page" : undefined}');
    expect(source).toContain("<RailLink activeSection={activeSection} item={item}");
  });
});
