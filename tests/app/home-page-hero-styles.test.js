import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("home page hero styles", () => {
  it("adds Playzone to the home hero buttons", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/page.js"), "utf8");

    expect(source).toContain('href="/playzone/"');
    expect(source).toContain(">Playzone<");
  });

  it("styles the home avatar as one static responsive image", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask \.profile_inner\s*\{[^}]*gap:\s*0\.36rem;/s);
    expect(stylesheet).toMatch(/\.profile-avatar\s*\{[^}]*width:\s*min\(21\.5rem,\s*80vw\);[^}]*aspect-ratio:\s*1;[^}]*margin-bottom:\s*0;[^}]*background-image:\s*url\("\/images\/home\/avatar-cats-ink-v2\.png"\);/s);
    expect(stylesheet).toMatch(/body\.dark\.list:has\(\.profile--rainy-mask\)\s+\.profile-avatar\s*\{[^}]*background-image:\s*url\("\/images\/home\/avatar-cats-ink-night-v2\.png"\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*480px\)[\s\S]*\.profile-avatar\s*\{[^}]*width:\s*min\(14\.6rem,\s*70vw\);/s);
    expect(stylesheet).not.toContain("profile-avatar-scene");
    expect(stylesheet).not.toContain("profile-avatar-layer");
    expect(stylesheet).not.toContain("--avatar-parallax");
    expect(stylesheet).toMatch(/\.profile h1\s*\{[^}]*margin-top:\s*0;/s);
    expect(stylesheet).not.toContain(".profile-avatar-note");
  });

  it("uses the night artwork and warm glow treatment for dark home mode", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/body\.dark\.list:has\(\.profile--rainy-mask\)\s*\{[^}]*home-night-ink-bg\.png[^}]*fixed,/s);
    expect(stylesheet).toMatch(/\.dark\s+\.header\s*\{[^}]*background:\s*transparent;/s);
    expect(stylesheet).toMatch(/body\.dark\.list:has\(\.profile--rainy-mask\)\s+\.profile h1\s*\{[^}]*#f1dfbd[^}]*text-shadow:/s);
    expect(stylesheet).toMatch(/body\.dark\.list:has\(\.profile--rainy-mask\)\s+\.profile \.button\s*\{[^}]*rgba\(237,\s*219,\s*184,\s*0\.88\)[^}]*border-color:\s*rgba\(232,\s*211,\s*171,\s*0\.58\);/s);
  });

  it("uses Ma Shan Zheng for the home hero title", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.profile\s+h1\s*\{[^}]*font-family:\s*"Ma Shan Zheng",\s*"Noto Serif CJK SC",\s*"Source Han Serif SC",\s*"Songti SC",\s*"STSong",\s*"SimSun",\s*cursive;/s);
  });

  it("uses dynamic viewport height so the footer can stay visible across platforms", () => {
    const baseStylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-base.css"), "utf8");
    const customStylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(customStylesheet).toMatch(/body\s*\{[^}]*min-height:\s*100vh;[^}]*min-height:\s*100dvh;[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s);
    expect(baseStylesheet).toMatch(/\.main\s*\{[^}]*flex:\s*1\s+0\s+auto;[^}]*width:\s*100%;[^}]*min-height:\s*0;[^}]*margin:\s*0\s+auto;/s);
    expect(baseStylesheet).not.toMatch(/\.main\s+\.profile\s*\{[^}]*min-height:\s*calc\(100vh\s*-\s*var\(--header-height\)\s*-\s*var\(--footer-height\)\s*-\s*\(var\(--gap\)\s*\*\s*2\)\);/s);
    expect(customStylesheet).toMatch(/@media\s*\(min-height:\s*740px\)\s*\{[\s\S]*\.main\s+\.profile\s*\{[^}]*min-height:\s*100%;/s);
  });
});
