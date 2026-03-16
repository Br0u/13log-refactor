import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("home page rain overlay styles", () => {
  it("renders a pure CSS rainy mask layer behind the homepage content", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask\s*\{[^}]*position:\s*relative;[^}]*isolation:\s*isolate;/s);
    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask::before\s*\{[^}]*position:\s*fixed;[^}]*inset:\s*0;[^}]*z-index:\s*1;/s);
    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask\s+\.profile_inner\s*\{[^}]*z-index:\s*3;/s);
  });

  it("uses the profile pseudo-elements for the rain layer instead of disabling them", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).not.toMatch(/\.main \.profile\.profile--rainy-mask::before,\s*\.main \.profile\.profile--rainy-mask::after\s*\{[^}]*content:\s*none;/s);
  });

  it("keeps the CSS rain layer non-interactive and visible without a canvas stage", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask::before\s*\{[^}]*pointer-events:\s*none;/s);
    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask::before\s*\{[^}]*opacity:\s*0\.5[0-9]?;/s);
    expect(stylesheet).not.toContain(".profile__rain-canvas");
  });

  it("cuts a clear hole around the homepage profile content so the rain stays at the edges", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask::before\s*\{[^}]*-webkit-mask-image:\s*radial-gradient\(/s);
    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask::before\s*\{[^}]*mask-image:\s*radial-gradient\(/s);
    expect(stylesheet).toMatch(/radial-gradient\([^)]*transparent[^)]*34%[^)]*#000[^)]*52%/s);
  });

  it("uses larger droplets and a slightly faster rain trail than the softer baseline", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toContain("radial-gradient(1.65rem 2.1rem");
    expect(stylesheet).toContain("radial-gradient(1.5rem 1.95rem");
    expect(stylesheet).toMatch(/animation:\s*rainyMaskSlide\s*5\.[0-9]s\s*linear\s*infinite;/s);
  });

  it("adds subtle ink-wash stains behind the homepage without overwhelming the content", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask\s*\{[^}]*--ink-wash-a:/s);
    expect(stylesheet).toContain("radial-gradient(24rem 18rem at 14% 16%, var(--ink-wash-a)");
    expect(stylesheet).toContain("radial-gradient(22rem 16rem at 86% 82%, var(--ink-wash-b)");
    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask::after\s*\{[^}]*opacity:\s*0\.3[0-9]?;/s);
  });
});
