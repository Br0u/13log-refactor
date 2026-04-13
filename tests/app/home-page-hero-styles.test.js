import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("home page hero styles", () => {
  it("adds Playzone to the home hero buttons", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/page.js"), "utf8");

    expect(source).toContain('href="/playzone/"');
    expect(source).toContain(">Playzone<");
  });

  it("styles the home avatar as a two-frame hover scene using the artwork's own circular border", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.profile-avatar-card\s*\{[^}]*position:\s*relative;/s);
    expect(stylesheet).toMatch(/\.profile-avatar-scene\s*\{[^}]*overflow:\s*visible;/s);
    expect(stylesheet).not.toMatch(/\.profile-avatar-scene\s*\{[^}]*border-radius:\s*999px;/s);
    expect(stylesheet).toMatch(/\.profile-avatar-frame\s*\{[^}]*object-fit:\s*contain;/s);
    expect(stylesheet).toMatch(/\.profile-avatar-popout\s*\{[^}]*position:\s*absolute;/s);
    expect(stylesheet).toMatch(/\.profile-avatar-popout--hover\s*\{[^}]*opacity:\s*0;/s);
    expect(stylesheet).toMatch(/\.profile-avatar-card:hover\s+\.profile-avatar-popout--hover,[\s\S]*\.profile-avatar-card:focus-within\s+\.profile-avatar-popout--hover\s*\{[^}]*opacity:\s*1;/s);
    expect(stylesheet).not.toContain(".profile-avatar-note");
    expect(stylesheet).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*\.profile-avatar-scene,[\s\S]*\.profile-avatar-frame,[\s\S]*\.profile-avatar-popout[\s\S]*transition:\s*none;/s);
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
