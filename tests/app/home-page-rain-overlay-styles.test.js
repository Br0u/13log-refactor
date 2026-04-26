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
    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask::before\s*\{[^}]*opacity:\s*0\.4[0-9]?;/s);
    expect(stylesheet).not.toContain(".profile__rain-canvas");
  });

  it("cuts a clear hole around the homepage profile content so the rain stays at the edges", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask::before\s*\{[^}]*-webkit-mask-image:\s*radial-gradient\(/s);
    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask::before\s*\{[^}]*mask-image:\s*radial-gradient\(/s);
    expect(stylesheet).toMatch(/radial-gradient\([^)]*transparent[^)]*34%[^)]*#000[^)]*52%/s);
  });

  it("animates independent droplet and streak layers instead of sliding one giant overlay", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toContain("radial-gradient(1.65rem 2.1rem at center");
    expect(stylesheet).toContain("radial-gradient(0.42rem 0.64rem at center");
    expect(stylesheet).toContain("background-size: 20% 30%, 15% 22%, 23% 32%, 17% 25%, 13% 20%, 19% 28%, 11% 16%, 100% 100%;");
    expect(stylesheet).toContain("background-position: 4% 8%, 13% 28%, 86% 10%, 92% 48%, 18% 68%, 78% 74%, 56% 18%, 0 0;");
    expect(stylesheet).toMatch(/animation:\s*rainyMaskDrops\s*13\.8s\s*linear\s*infinite,\s*rainyMaskBreath\s*8\.5s\s*ease-in-out\s*infinite\s*alternate;/s);
    expect(stylesheet).toMatch(/animation:\s*rainyMaskStreaks\s*9\.8s\s*linear\s*infinite,\s*rainyMaskMist\s*17s\s*ease-in-out\s*infinite\s*alternate;/s);
    expect(stylesheet).not.toContain("rainyMaskSlide");
  });

  it("uses background-position keyframes for the rain motion rather than translating the full mask", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");
    const dropsKeyframes = stylesheet.slice(
      stylesheet.indexOf("@keyframes rainyMaskDrops"),
      stylesheet.indexOf("@keyframes rainyMaskBreath")
    );
    const streaksKeyframes = stylesheet.slice(
      stylesheet.indexOf("@keyframes rainyMaskStreaks"),
      stylesheet.indexOf("@keyframes rainyMaskMist")
    );
    const breathKeyframes = stylesheet.slice(
      stylesheet.indexOf("@keyframes rainyMaskBreath"),
      stylesheet.indexOf("@keyframes rainyMaskStreaks")
    );
    const mistKeyframes = stylesheet.slice(
      stylesheet.indexOf("@keyframes rainyMaskMist"),
      stylesheet.indexOf(".profile-avatar-card")
    );

    expect(dropsKeyframes).toContain("background-position: 4% 8%, 13% 28%, 86% 10%, 92% 48%, 18% 68%, 78% 74%, 56% 18%, 0 0;");
    expect(dropsKeyframes).toContain("background-position: 11% 46%, 18% 70%, 79% 38%, 97% 92%, 25% 100%, 72% 100%, 60% 56%, 0 0;");
    expect(streaksKeyframes).toContain("background-position: 0 0, 0 0, 7% -20%, 35% -34%, 72% -12%, 54% -44%, 0 0;");
    expect(streaksKeyframes).toContain("background-position: 0 0, 0 0, 3% 112%, 41% 118%, 67% 108%, 58% 124%, 0 0;");
    expect(breathKeyframes).toContain("opacity: 0.38;");
    expect(breathKeyframes).toContain("opacity: 0.52;");
    expect(mistKeyframes).toContain("filter: blur(0.15px);");
    expect(mistKeyframes).toContain("filter: blur(0.55px);");
    expect(dropsKeyframes).not.toContain("transform:");
    expect(streaksKeyframes).not.toContain("transform:");
  });

  it("respects reduced-motion by freezing rain animation to a static texture", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*\.main \.profile\.profile--rainy-mask::before,[\s\S]*\.main \.profile\.profile--rainy-mask::after\s*\{[^}]*animation:\s*none;/s);
  });

  it("adds subtle ink-wash stains behind the homepage without overwhelming the content", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask\s*\{[^}]*--ink-wash-a:/s);
    expect(stylesheet).toContain("radial-gradient(24rem 18rem at 14% 16%, var(--ink-wash-a)");
    expect(stylesheet).toContain("radial-gradient(22rem 16rem at 86% 82%, var(--ink-wash-b)");
    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask::after\s*\{[^}]*opacity:\s*0\.2[0-9]?;/s);
  });
});
