import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile surface styles", () => {
  it("restores page-specific ink backgrounds after the mobile body reset", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");
    const resetIndex = stylesheet.indexOf("html,\n  body {\n    overflow-x: hidden;\n    background: var(--theme);");
    const mobileBackgroundIndex = stylesheet.indexOf("@media (max-width: 960px)", stylesheet.indexOf("/* Mobile surface polish */"));

    expect(resetIndex).toBeGreaterThan(-1);
    expect(mobileBackgroundIndex).toBeGreaterThan(resetIndex);
    expect(stylesheet).toMatch(/body\.list:has\(\.profile--rainy-mask\)\s*\{[^}]*home-ink-landscape\.png[^}]*fixed,/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body\.list:has\(\.profile--rainy-mask\)\s*\{[^}]*home-mobile-ink-bg\.png[^}]*no-repeat,/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body\.dark\.list:has\(\.profile--rainy-mask\)\s*\{[^}]*home-night-ink-bg\.png[^}]*no-repeat,/s);
    expect(stylesheet).toMatch(/body:has\(\.blog-layout--posts-index\),\s*body:has\(\.blog-layout--post-detail\)\s*\{[^}]*posts-ink-bg\.png[^}]*fixed,/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body:has\(\.blog-layout--posts-index\),\s*body:has\(\.blog-layout--post-detail\)\s*\{[^}]*posts-mobile-ink-bg\.png[^}]*no-repeat,/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body\.dark:has\(\.blog-layout--posts-index\),\s*body\.dark:has\(\.blog-layout--post-detail\)\s*\{[^}]*posts-mobile-night-ink-bg\.png[^}]*no-repeat,/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body:has\(\.blog-layout--link-index:not\(\.playzone-layout\)\)\s*\{[^}]*link-mobile-ink-bg\.png[^}]*no-repeat,/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body\.dark:has\(\.blog-layout--link-index:not\(\.playzone-layout\)\)\s*\{[^}]*link-mobile-night-ink-bg\.png[^}]*no-repeat,/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body:has\(\.playzone-layout\)\s*\{[^}]*playzone-mobile-ink-bg\.png[^}]*no-repeat,/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body\.dark:has\(\.playzone-layout\)\s*\{[^}]*playzone-mobile-night-ink-bg\.png[^}]*no-repeat,/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body:has\(\.blog-layout--photos-index\),\s*body:has\(\.blog-layout--photo-album\)\s*\{[^}]*photos-mobile-ink-bg\.png[^}]*no-repeat,/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body\.dark:has\(\.blog-layout--photos-index\),\s*body\.dark:has\(\.blog-layout--photo-album\)\s*\{[^}]*photos-mobile-night-ink-bg\.png[^}]*no-repeat,/s);
    expect(stylesheet).toMatch(/body:has\(\.about-note-layout--ink\)\s*\{[^}]*about-ink-bg\.png[^}]*fixed,/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body:has\(\.about-note-layout--ink\)\s*\{[^}]*about-mobile-ink-bg\.png[^}]*no-repeat,/s);
  });

  it("tightens the home hero controls for narrow screens", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.profile-avatar-scene\s*\{[^}]*touch-action:\s*pan-y;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.profile-avatar-scene\s*\{[^}]*width:\s*min\(16\.8rem,\s*72vw\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.profile\s+\.buttons\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.profile\s+\.button--playzone\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;/s);
  });

  it("uses mobile depth artwork, masks, and restrained parallax offsets", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*\.home-depth-background\s*\{[^}]*--home-depth-layer-scale:\s*1\.035;[^}]*transparent 24%[\s\S]*48%[\s\S]*72%/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*\.home-depth-background__layer\s*\{[^}]*inset:\s*-3vmax;[^}]*home-mobile-ink-bg\.png[^}]*home-mobile-ink-bg\.webp[^}]*center top/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*\.home-depth-background__layer--middle\s*\{[^}]*\* 5px[^}]*\* 4px/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*\.home-depth-background__layer--front\s*\{[^}]*\* 8px[^}]*\* 6px/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*\.home-depth-background\s*\{[^}]*transparent 27%/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body\.dark\.list:has\(\.profile--rainy-mask\) \.home-depth-background\s*\{[^}]*transparent 26%[\s\S]*50%[\s\S]*74%/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body\.dark\.list:has\(\.profile--rainy-mask\) \.home-depth-background__layer\s*\{[^}]*home-night-ink-bg\.png[^}]*home-night-ink-bg\.webp[^}]*center top/s);
    expect(stylesheet).toMatch(/transparent 29%/);
  });

  it("keeps shared content cards and long-form articles inside the mobile viewport", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*\.main:has\(\.blog-layout\)\s*\{[^}]*max-width:\s*min\(100%,\s*calc\(100vw\s*-\s*1\.25rem\)\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.posts-masonry--posts-list\s+\.post-preview-card--post,[\s\S]*\.link-essay-entry\s*\{[^}]*box-shadow:\s*0\.28rem\s+0\.28rem\s+0\s+#000;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.photo-album-card__title\s*\{[^}]*width:\s*min\(100%,\s*16rem\);[^}]*min-height:\s*0;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.post-single\s+\.post-content\s*\{[^}]*font-size:\s*1\.06rem;[^}]*line-height:\s*1\.82;/s);
  });

  it("uses the posts night mobile artwork and glass treatment on narrow dark posts pages", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(fs.existsSync(path.join(process.cwd(), "public/images/backgrounds/posts-mobile-rail-bg.png"))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), "public/images/backgrounds/posts-mobile-night-rail-bg.png"))).toBe(true);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--posts-index\)\s+#menu\s*\{[^}]*position:\s*fixed;[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\);/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--posts-index\)\s+#menu\s+\.site-nav-icon\s*\{[^}]*display:\s*block;/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--posts-index\)\s+\.blog-rail__nav\s*\{[^}]*display:\s*none;/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--posts-index\)\s+\.blog-rail\s*\{[^}]*grid-template-columns:\s*minmax\(10\.4rem,\s*0\.82fr\)\s+minmax\(0,\s*1\.18fr\);[^}]*posts-mobile-night-rail-bg\.png[^}]*center\s*\/\s*106%\s+106%\s+no-repeat,/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--posts-index\)\s+\.blog-rail__brand\s*\{[^}]*min-height:\s*0;[^}]*border:\s*none;/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--posts-index\)\s+\.blog-rail__brand-home\s*\{[^}]*width:\s*100%;[^}]*min-height:\s*0;/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--posts-index\)\s+\.blog-rail__section--intro\s*\{[^}]*position:\s*relative;[^}]*min-width:\s*0;[^}]*width:\s*100%;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*540px\)\s*\{[\s\S]*body:has\(\.blog-layout--posts-index\)\s+\.blog-rail,[\s\S]*body\.dark:has\(\.blog-layout--posts-index\)\s+\.blog-rail\s*\{[^}]*grid-template-columns:\s*1fr;[^}]*min-height:\s*0;/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--posts-index\)\s+\.blog-rail__intro-text\s*\{[^}]*font-size:\s*clamp\(0\.78rem,\s*1\.8vw,\s*0\.94rem\);[^}]*overflow-wrap:\s*anywhere;/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--posts-index\)\s+\.blog-rail__intro-text\s+span\s*\{[^}]*display:\s*block;[^}]*white-space:\s*normal;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*body\.dark:has\(\.blog-layout--posts-index\)\s+\.posts-masonry--posts-list\s+\.post-preview-card--post,[\s\S]*\.post-preview-card__micro-surface\s*\{[^}]*backdrop-filter:\s*blur\(10px\);/s);
  });

  it("aligns day mobile layouts with their night mobile structure for posts about link playzone and photos", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body:has\(\.blog-layout--posts-index\)\s+#menu\s*\{[^}]*position:\s*fixed;[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\);/s);
    expect(stylesheet).toMatch(/body:has\(\.blog-layout--posts-index\)\s+\.blog-rail\s*\{[^}]*grid-template-columns:\s*minmax\(10\.4rem,\s*0\.82fr\)\s+minmax\(0,\s*1\.18fr\);[^}]*posts-mobile-rail-bg\.png[^}]*center\s*\/\s*106%\s+106%\s+no-repeat,/s);
    expect(stylesheet).toMatch(/body:has\(\.blog-layout--posts-index\)\s+\.blog-rail__brand\s*\{[^}]*min-height:\s*0;[^}]*border:\s*none;/s);
    expect(stylesheet).toMatch(/body:has\(\.blog-layout--posts-index\)\s+\.blog-rail__brand-home\s*\{[^}]*width:\s*100%;[^}]*min-height:\s*0;/s);
    expect(stylesheet).toMatch(/body:has\(\.blog-layout--posts-index\)\s+\.blog-rail__intro-text\s*\{[^}]*font-size:\s*clamp\(0\.78rem,\s*1\.8vw,\s*0\.94rem\);[^}]*overflow-wrap:\s*anywhere;/s);
    expect(stylesheet).toMatch(/body:has\(\.blog-layout--posts-index\)\s+\.blog-rail__intro-text\s+span\s*\{[^}]*display:\s*block;[^}]*white-space:\s*normal;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body:has\(\.blog-layout--photos-index\)\s+#menu,[\s\S]*\{[^}]*position:\s*fixed;[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body:has\(\.blog-layout--photos-index\)\s+#menu\s+\.site-nav-icon,[\s\S]*\{[^}]*display:\s*block;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body:has\(\.blog-layout--posts-index\)\s+\.blog-rail__nav\s*\{[^}]*display:\s*none;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body:has\(\.about-note-layout--ink\)\s+#menu\s*\{[^}]*position:\s*fixed;[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body:has\(\.about-note-layout--ink\)\s+\.about-note__map-rail--side\s*\{[^}]*display:\s*none;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*body:has\(\.blog-layout--link-index:not\(\.playzone-layout\)\)\s+#menu\s*\{[^}]*position:\s*fixed;[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*body:has\(\.blog-layout--link-index:not\(\.playzone-layout\)\)\s+\.link-essay-entry__layout\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(5\.4rem,\s*8\.7rem\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*body:has\(\.playzone-layout\)\s+#menu\s*\{[^}]*position:\s*fixed;[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*body:has\(\.playzone-layout\)\s+\.playzone-filter\s*\{[^}]*display:\s*flex;[^}]*overflow-x:\s*auto;/s);
  });
});
