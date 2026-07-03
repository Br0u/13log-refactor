import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("playzone page", () => {
  it("uses the same editorial list layout pattern as the link page", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/playzone/page.jsx"), "utf8");

    expect(source).toContain('title: "Playzone | 我的小小世界"');
    expect(source).toContain('className="blog-layout blog-layout--link-index playzone-layout"');
    expect(source).toContain('variant="link"');
    expect(source).toContain("hideIntroCard");
    expect(source).toContain('className="blog-layout__main"');
    expect(source).toContain('className="link-essay-group"');
    expect(source).toContain('className="link-essay-list"');
    expect(source).toContain('className={`link-essay-entry ${!project.image ? "link-board-card--preview-pending" : ""}`}');
    expect(source).toContain('className="link-essay-entry__layout"');
    expect(source).not.toContain('className="playzone-card"');
  });

  it("renders project links with the link-page preview extraction hooks", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/playzone/page.jsx"), "utf8");
    const dataSource = fs.readFileSync(path.join(process.cwd(), "app/playzone/projects.js"), "utf8");
    const enhancements = fs.readFileSync(path.join(process.cwd(), "app/components/ClientEnhancements.js"), "utf8");

    expect(dataSource).toContain("Dance Text");
    expect(dataSource).toContain("https://dancetext-rho.vercel.app");
    expect(dataSource).toContain("Play Text");
    expect(dataSource).toContain("https://playtext-five.vercel.app");
    expect(source).toContain("data-link-card");
    expect(source).toContain('data-preview-enabled="true"');
    expect(source).toContain("data-preview-url={project.href}");
    expect(source).toContain('className="link-essay-entry__preview is-empty"');
    expect(source).toContain('data-preview-container');
    expect(source).toContain('data-preview-title');
    expect(source).toContain('data-preview-desc');
    expect(source).toContain('className="entry-link"');
    expect(enhancements).toContain('const isPlayzonePage = pathname === "/playzone" || pathname.startsWith("/playzone/");');
    expect(enhancements).toContain("if (isLinkPage || isPlayzonePage)");
  });

  it("keeps playzone-specific styling limited to width and section polish instead of custom cards", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");
    const globals = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

    expect(stylesheet).toMatch(/\.playzone-layout\s+\.link-essay-list\s*\{[^}]*gap:\s*1rem;/s);
    expect(stylesheet).toMatch(/\.playzone-layout\s+\.link-essay-entry__preview\s*\{[^}]*min-height:\s*12rem;/s);
    expect(stylesheet).toMatch(/\.playzone-layout\s+\.link-essay-entry__title\s*\{[^}]*font-size:\s*1\.25rem;/s);
    expect(stylesheet).toContain("body:has(.playzone-layout)");
    expect(stylesheet).toContain('url("/images/backgrounds/playzone-ink-bg.png") center / cover no-repeat fixed');
    expect(stylesheet).toContain(".dark body:has(.playzone-layout)");
    expect(globals).toMatch(/\.main:has\(\.playzone-layout\)\s*\{[^}]*max-width:\s*var\(--blog-shell-width\);[^}]*padding-inline:\s*0;/s);
    expect(stylesheet).not.toContain(".playzone-card");
  });
});
