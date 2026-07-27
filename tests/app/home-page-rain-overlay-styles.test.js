import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("home page rain overlay styles", () => {
  it("renders a pure CSS rainy mask layer behind the homepage content", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask\s*\{[^}]*position:\s*relative;[^}]*isolation:\s*isolate;/s);
    expect(stylesheet).toMatch(/\.home-depth-background\s*\{[^}]*z-index:\s*0;/s);
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
    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask::before\s*\{[^}]*opacity:\s*0\.3[0-9]?;/s);
    expect(stylesheet).not.toContain(".profile__rain-canvas");
  });

  it("cuts a clear hole around the homepage profile content so the rain stays at the edges", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask::before\s*\{[^}]*-webkit-mask-image:\s*radial-gradient\(/s);
    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask::before\s*\{[^}]*mask-image:\s*radial-gradient\(/s);
    expect(stylesheet).toMatch(/radial-gradient\([^)]*transparent[^)]*34%[^)]*#000[^)]*52%/s);
  });

  it("styles individual falling drops instead of looping a background texture", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.home-rain-layer\s*\{[^}]*position:\s*fixed;[^}]*pointer-events:\s*none;/s);
    expect(stylesheet).toMatch(/\.home-rain-drop\s*\{[^}]*left:\s*var\(--rain-x\);[^}]*animation:\s*homeRainDrop\s+var\(--rain-duration\)\s+cubic-bezier/s);
    expect(stylesheet).toMatch(/\.home-rain-drop::before\s*\{[^}]*height:\s*var\(--rain-length\);[^}]*background:\s*linear-gradient/s);
    expect(stylesheet).not.toContain("rainyMaskDrops");
    expect(stylesheet).not.toContain("rainyMaskStreaks");
  });

  it("uses per-drop transform keyframes for falling and drifting motion", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");
    const dropKeyframes = stylesheet.slice(
      stylesheet.indexOf("@keyframes homeRainDrop"),
      stylesheet.indexOf("@media (prefers-reduced-motion: reduce)")
    );

    expect(dropKeyframes).toContain("transform: translate3d(0, -12vh, 0) rotate(var(--rain-angle));");
    expect(dropKeyframes).toContain("transform: translate3d(var(--rain-drift), var(--rain-fall), 0) rotate(var(--rain-angle));");
    expect(dropKeyframes).toContain("opacity: 0;");
    expect(dropKeyframes).not.toContain("background-position:");
  });

  it("respects reduced-motion by freezing rain animation to a static texture", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*\.home-rain-layer\s*\{[^}]*display:\s*none;/s);
  });

  it("adds subtle ink-wash stains behind the homepage without overwhelming the content", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask\s*\{[^}]*--ink-wash-a:/s);
    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask\s*\{[^}]*--rain-drop-color:/s);
    expect(stylesheet).toContain("radial-gradient(24rem 18rem at 14% 16%, var(--ink-wash-a)");
    expect(stylesheet).toContain("radial-gradient(22rem 16rem at 86% 82%, var(--ink-wash-b)");
    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask::after\s*\{[^}]*opacity:\s*0\.1[0-9]?;/s);
  });

  it("uses cooler, weaker rain highlights in the night home theme", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/body\.dark\.list:has\(\.profile--rainy-mask\)\s+\.main \.profile\.profile--rainy-mask\s*\{[^}]*--rain-drop-color:\s*rgba\(207,\s*224,\s*248,\s*0\.42\);/s);
    expect(stylesheet).toMatch(/body\.dark\.list:has\(\.profile--rainy-mask\)\s+\.home-rain-layer\s*\{[^}]*mix-blend-mode:\s*screen;/s);
  });
});
