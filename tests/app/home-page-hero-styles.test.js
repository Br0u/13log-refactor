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
});
