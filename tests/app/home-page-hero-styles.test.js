import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("home page hero styles", () => {
  it("adds Playzone to the home hero buttons", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/page.js"), "utf8");

    expect(source).toContain('href="/playzone/"');
    expect(source).toContain(">Playzone<");
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
