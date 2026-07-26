import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("home page hero styles", () => {
  it("adds Playzone to the home hero buttons", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/page.js"), "utf8");

    expect(source).toContain('href="/playzone/"');
    expect(source).toContain(">Playzone<");
  });

  it("styles the home avatar as a frameless circular crop", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.profile-avatar-card\s*\{[^}]*position:\s*relative;/s);
    expect(stylesheet).not.toContain(".profile-avatar-card::after");
    expect(stylesheet).toMatch(/\.main \.profile\.profile--rainy-mask \.profile_inner\s*\{[^}]*gap:\s*0\.36rem;/s);
    expect(stylesheet).toMatch(/\.profile-avatar-card\s*\{[^}]*margin-bottom:\s*-0\.22rem;/s);
    expect(stylesheet).toMatch(/\.profile-avatar-scene\s*\{[^}]*width:\s*min\(21\.5rem,\s*80vw\);/s);
    expect(stylesheet).toMatch(/\.profile-avatar-scene\s*\{[^}]*aspect-ratio:\s*1;/s);
    expect(stylesheet).toMatch(/\.profile-avatar-scene\s*\{[^}]*overflow:\s*hidden;/s);
    expect(stylesheet).toMatch(/\.profile-avatar-scene\s*\{[^}]*border-radius:\s*50%;/s);
    expect(stylesheet).toMatch(/\.profile-avatar-scene\s*\{[^}]*background:\s*transparent;/s);
    expect(stylesheet).not.toMatch(/\.profile-avatar-scene\s*\{[^}]*border:/s);
    expect(stylesheet).not.toMatch(/\.profile-avatar-scene\s*\{[^}]*box-shadow:/s);
    expect(stylesheet).toMatch(/\.profile-avatar-scene\s*\{[^}]*--avatar-parallax-x:\s*0;[^}]*--avatar-parallax-y:\s*0;/s);
    expect(stylesheet).toMatch(/\.profile-avatar-scene\s*\{[^}]*rotateX\(calc\(var\(--avatar-parallax-y\)\s*\*\s*-6deg\)\)[^}]*rotateY\(calc\(var\(--avatar-parallax-x\)\s*\*\s*6deg\)\)/s);
    expect(stylesheet).toMatch(/\.profile-avatar-layer\s*\{[^}]*object-fit:\s*cover;/s);
    expect(stylesheet).toMatch(/\.profile-avatar-layer\s*\{[^}]*pointer-events:\s*none;/s);
    expect(stylesheet).toMatch(/\.profile-avatar-layer--middle\s*\{[^}]*var\(--avatar-middle-mask\)/s);
    expect(stylesheet).toMatch(/\.profile-avatar-layer--front\s*\{[^}]*var\(--avatar-front-mask\)/s);
    expect(stylesheet).toMatch(/\.profile-avatar-state\s*\{[^}]*opacity:\s*0;/s);
    expect(stylesheet).toMatch(/\.profile-avatar-state--base\s*\{[^}]*opacity:\s*1;[^}]*--avatar-middle-mask:[^}]*62%\s+58%/s);
    expect(stylesheet).toMatch(/\.profile-avatar-state--hover\s*\{[^}]*--avatar-front-mask:[^}]*78%\s+27%/s);
    expect(stylesheet).toMatch(/\.profile-avatar-state--night\s*\{[^}]*--avatar-front-mask:[^}]*63%\s+66%/s);
    expect(stylesheet).toMatch(/@media\s*\(hover:\s*hover\)\s+and\s+\(pointer:\s*fine\)[\s\S]*\.profile-avatar-card:hover\s+\.profile-avatar-state--base[\s\S]*opacity:\s*0;[\s\S]*\.profile-avatar-card:hover\s+\.profile-avatar-state--hover[\s\S]*opacity:\s*1;/s);
    expect(stylesheet).toMatch(/body\.dark\.list:has\(\.profile--rainy-mask\)\s+\.profile-avatar-state--base,[\s\S]*\.profile-avatar-state--hover\s*\{[^}]*opacity:\s*0;[\s\S]*\.profile-avatar-state--night\s*\{[^}]*opacity:\s*1;/s);
    expect(stylesheet).toMatch(/\.profile h1\s*\{[^}]*margin-top:\s*0;/s);
    expect(stylesheet).not.toContain(".profile-avatar-note");
    expect(stylesheet).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.profile-avatar-layer--fallback[\s\S]*filter:\s*none;/s);
    expect(stylesheet).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.profile-avatar-layer--fallback\s*\{[^}]*opacity:\s*1;/s);
    expect(stylesheet).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.profile-avatar-card:hover,[\s\S]*\.profile-avatar-card:focus-visible\s*\{[^}]*transform:\s*none;/s);
    expect(stylesheet).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.profile-avatar-layer--background,[\s\S]*\.profile-avatar-layer--middle,[\s\S]*\.profile-avatar-layer--front\s*\{[^}]*opacity:\s*0;/s);
    expect(stylesheet).toMatch(/@media\s*\(hover:\s*none\)\s+and\s+\(pointer:\s*coarse\)[\s\S]*\.profile-avatar-scene\[data-parallax-active="false"\][\s\S]*@keyframes\s+profileAvatarBreath/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*480px\)[\s\S]*\.profile-avatar-scene\s*\{[^}]*width:\s*min\(14\.6rem,\s*70vw\);/s);
  });

  it("keeps the parallax layers pixel-aligned at rest without composite cutouts", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");
    const supportsStart = stylesheet.indexOf("@supports ((mask-image:");
    const supportsEnd = stylesheet.indexOf("@media (hover: hover)", supportsStart);
    const maskStyles = stylesheet.slice(supportsStart, supportsEnd);

    expect(supportsStart).toBeGreaterThan(-1);
    expect(supportsEnd).toBeGreaterThan(supportsStart);
    expect(stylesheet).toMatch(/\.profile-avatar-scene\s*\{[^}]*--avatar-layer-scale:\s*1\.045;/s);
    expect(stylesheet).not.toContain("--avatar-middle-cutout");
    expect(stylesheet).not.toContain("--avatar-front-cutout");
    expect(maskStyles).not.toContain("mask-composite");
    expect(maskStyles).not.toMatch(/\.profile-avatar-layer--background\s*\{[^}]*mask-image:/s);
    expect(maskStyles).toMatch(/\.profile-avatar-layer--fallback\s*\{[^}]*opacity:\s*0;/s);
    expect(maskStyles.match(/scale\(var\(--avatar-layer-scale\)\)/g)).toHaveLength(3);
  });

  it("uses the night artwork and warm glow treatment for dark home mode", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/body\.dark\.list:has\(\.profile--rainy-mask\)\s*\{[^}]*home-night-ink-bg\.png[^}]*fixed,/s);
    expect(stylesheet).toMatch(/\.dark\s+\.header\s*\{[^}]*background:\s*transparent;/s);
    expect(stylesheet).toMatch(/body\.dark\.list:has\(\.profile--rainy-mask\)\s+\.profile-avatar-scene\s*\{[^}]*filter:\s*none;/s);
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
