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
    expect(source).toContain('className="playzone-intro-copy"');
    expect(source).toContain('className="playzone-filter"');
    expect(source).toContain('className="link-essay-group"');
    expect(source).toContain('className="link-essay-list"');
    expect(source).toContain('className={`link-essay-entry ${!project.image ? "link-board-card--preview-pending" : ""}`}');
    expect(source).toContain('className="link-essay-entry__layout"');
    expect(source).toContain('className="playzone-project-tags"');
    expect(source).toContain('className="playzone-project-cta"');
    expect(source).not.toContain('className="playzone-card"');
  });

  it("renders project links with the link-page preview extraction hooks", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/playzone/page.jsx"), "utf8");
    const dataSource = fs.readFileSync(path.join(process.cwd(), "app/playzone/projects.js"), "utf8");
    const enhancements = fs.readFileSync(path.join(process.cwd(), "app/components/ClientEnhancements.js"), "utf8");

    expect(dataSource).toContain("Dance Text");
    expect(dataSource).toContain("https://dancetext-rho.vercel.app");
    expect(dataSource).toContain('tags: ["互动实验", "创意表达"]');
    expect(dataSource).toContain("Play Text");
    expect(dataSource).toContain("https://playtext-five.vercel.app");
    expect(dataSource).toContain('tags: ["文本游戏", "极简交互"]');
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
    expect(stylesheet).toContain('image-set(url("/images/backgrounds/playzone-ink-bg.webp") type("image/webp"), url("/images/backgrounds/playzone-ink-bg.png") type("image/png")) center / cover no-repeat fixed');
    expect(stylesheet).toContain("body.dark:has(.playzone-layout)");
    expect(globals).toMatch(/\.main:has\(\.playzone-layout\)\s*\{[^}]*max-width:\s*var\(--blog-shell-width\);[^}]*padding-inline:\s*0;/s);
    expect(stylesheet).not.toContain(".playzone-card");
  });

  it("gives playzone a dedicated blue glass treatment in dark mode", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toContain('image-set(url("/images/backgrounds/playzone-night-ink-bg.webp") type("image/webp"), url("/images/backgrounds/playzone-night-ink-bg.png") type("image/png")) center / cover no-repeat fixed');
    expect(stylesheet).toMatch(/body\.dark:has\(\.playzone-layout\)\s*\{[^}]*--primary:\s*#dbeaff;[^}]*playzone-night-ink-bg\.png/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.playzone-layout\)\s+\.blog-rail\s*\{[^}]*border-color:\s*rgba\(105,\s*157,\s*226,\s*0\.34\);[^}]*background:[^}]*rgba\(5,\s*12,\s*22,\s*0\.34\);[^}]*box-shadow:[^}]*rgba\(0,\s*0,\s*0,\s*0\.62\)/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.playzone-layout\)\s+\.link-essay-entry\s*\{[^}]*border-color:\s*rgba\(105,\s*157,\s*226,\s*0\.36\);[^}]*background:[^}]*rgba\(4,\s*12,\s*24,\s*0\.7\)[^}]*box-shadow:[^}]*rgba\(0,\s*0,\s*0,\s*0\.62\)/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.playzone-layout\)\s+\.link-essay-entry__preview\s*\{[^}]*border-color:\s*rgba\(105,\s*157,\s*226,\s*0\.24\);[^}]*background:[^}]*rgba\(4,\s*12,\s*24,\s*0\.72\);[^}]*filter:\s*brightness\(0\.72\)\s+saturate\(0\.7\)\s+contrast\(1\.08\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body\.dark:has\(\.playzone-layout\)\s*\{[^}]*playzone-mobile-night-ink-bg\.png[^}]*no-repeat,/s);
  });

  it("uses a dedicated mobile night playzone layout with bottom tabs", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toContain('image-set(url("/images/backgrounds/playzone-mobile-night-ink-bg.webp") type("image/webp"), url("/images/backgrounds/playzone-mobile-night-ink-bg.png") type("image/png")) center top / cover no-repeat');
    expect(stylesheet).toMatch(/body\.dark:has\(\.playzone-layout\)\s+#menu\s*\{[^}]*position:\s*fixed;[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\);/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.playzone-layout\)\s+#menu\s+\.site-nav-icon\s*\{[^}]*display:\s*block;/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.playzone-layout\)\s+\.playzone-filter\s*\{[^}]*display:\s*flex;[^}]*overflow-x:\s*auto;/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.playzone-layout\)\s+\.link-essay-entry__layout\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(5\.8rem,\s*9\.4rem\);/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.playzone-layout\)\s+\.playzone-project-tags\s*\{[^}]*display:\s*flex;/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.playzone-layout\)\s+\.playzone-project-cta\s*\{[^}]*color:\s*rgba\(91,\s*163,\s*255,\s*0\.94\);/s);
  });
});
