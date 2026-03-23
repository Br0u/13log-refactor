import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("link page", () => {
  it("renders grouped editorial sections instead of the old masonry board", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/link/page.js"), "utf8");

    expect(source).toContain("Tech Blogs");
    expect(source).toContain("Content Blogs");
    expect(source).toContain('className="blog-layout blog-layout--link-index"');
    expect(source).toContain('variant="link"');
    expect(source).toContain('introTitle="前言"');
    expect(source).toContain('className="link-essay-group"');
    expect(source).toContain('className="link-essay-list"');
    expect(source).toContain('className="link-essay-entry__eyebrow"');
    expect(source).toContain('className="link-essay-entry__body"');
    expect(source).not.toContain('className="posts-masonry"');
  });

  it("renders markdown-rich link descriptions and quiet related links", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/link/page.js"), "utf8");

    expect(source).toContain("descriptionHtml");
    expect(source).toContain('className="link-essay-entry__related"');
    expect(source).toContain("data-preview-container");
    expect(source).toContain("data-preview-title");
    expect(source).toContain("data-preview-desc");
    expect(source).toContain('className="entry-link"');
    expect(source).not.toContain(">Open<");
  });
});
