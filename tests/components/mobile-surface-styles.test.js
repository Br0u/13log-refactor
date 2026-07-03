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
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body\.list:has\(\.profile--rainy-mask\)\s*\{[^}]*home-ink-landscape\.png[^}]*no-repeat,/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body:has\(\.blog-layout--posts-index\),\s*body:has\(\.blog-layout--post-detail\)\s*\{[^}]*posts-ink-bg\.png[^}]*no-repeat,/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body:has\(\.blog-layout--link-index:not\(\.playzone-layout\)\)\s*\{[^}]*link-ink-bg\.png[^}]*no-repeat,/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body:has\(\.playzone-layout\)\s*\{[^}]*playzone-ink-bg\.png[^}]*no-repeat,/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body:has\(\.blog-layout--photos-index\),\s*body:has\(\.blog-layout--photo-album\)\s*\{[^}]*photos-ink-bg\.png[^}]*no-repeat,/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body:has\(\.about-note-layout--ink\)\s*\{[^}]*about-ink-bg\.png[^}]*no-repeat,/s);
  });

  it("tightens the home hero controls for narrow screens", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.profile-avatar-scene\s*\{[^}]*width:\s*min\(16\.8rem,\s*72vw\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.profile\s+\.buttons\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.profile\s+\.button--playzone\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;/s);
  });

  it("keeps shared content cards and long-form articles inside the mobile viewport", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*\.main:has\(\.blog-layout\)\s*\{[^}]*max-width:\s*min\(100%,\s*calc\(100vw\s*-\s*1\.25rem\)\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.posts-masonry--posts-list\s+\.post-preview-card--post,[\s\S]*\.link-essay-entry\s*\{[^}]*box-shadow:\s*0\.28rem\s+0\.28rem\s+0\s+#000;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.photo-album-card__title\s*\{[^}]*width:\s*min\(100%,\s*16rem\);[^}]*min-height:\s*0;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.post-single\s+\.post-content\s*\{[^}]*font-size:\s*1\.06rem;[^}]*line-height:\s*1\.82;/s);
  });
});
