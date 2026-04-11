import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("root layout footer", () => {
  it("renders the editorial footer badges and copyright", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/layout.js"), "utf8");

    expect(source).toMatch(/<html lang="zh-CN" dir="auto">/);
    expect(source).toMatch(/https:\/\/cdn\.jsdelivr\.net\/npm\/@callmebill\/lxgw-wenkai-web@latest\/style\.css/);
    expect(source).toMatch(/<div className="footer__badges"/);
    expect(source).toMatch(/href="https:\/\/notbyai\.fyi\/"/);
    expect(source).toMatch(/href="https:\/\/creativecommons\.org\/licenses\/by-nc-sa\/4\.0\/"/);
    expect(source).toMatch(/src="\/badges\/written-by-human-not-by-ai-black\.svg"/);
    expect(source).toMatch(/src="\/badges\/cc-by-nc-sa\.svg"/);
    expect(source).toMatch(/alt="Written By Human, Not By AI"/);
    expect(source).toMatch(/alt="Creative Commons BY-NC-SA"/);
    expect(source).toMatch(/\/ 非 AI 创作/);
    expect(source).toMatch(/\/ 内容许可协议/);
    expect(source).toMatch(/className="footer__meta"/);
  });
});
