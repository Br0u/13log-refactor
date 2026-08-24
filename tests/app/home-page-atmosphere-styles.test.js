import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { centerMaskStops, mediaBlockContaining } from "../helpers/css-rules";

const stylesheet = () => fs.readFileSync(
  path.join(process.cwd(), "app/papermod-custom.css"),
  "utf8",
);
const rule = (css, selector) => new RegExp(`${selector}\\s*\\{([^}]*)\\}`, "s").exec(css)?.[1] ?? "";

describe("home page atmosphere styles", () => {
  it("keeps the decorative atmosphere behind the unchanged homepage content", () => {
    const css = stylesheet();
    const profileBefore = rule(css, "\\.main \\.profile\\.profile--atmosphere::before");
    const profilePseudos = rule(
      css,
      "\\.main \\.profile\\.profile--atmosphere::before,\\s*\\.main \\.profile\\.profile--atmosphere::after",
    );

    expect(css).toMatch(/\.main \.profile\.profile--atmosphere\s*\{[^}]*position:\s*relative;[^}]*isolation:\s*isolate;/s);
    expect(css).toMatch(/\.home-depth-background\s*\{[^}]*z-index:\s*0;/s);
    expect(profilePseudos).toMatch(/content:\s*"";/);
    expect(profilePseudos).not.toMatch(/content:\s*none;/);
    expect(profileBefore).toMatch(/position:\s*fixed;[^}]*inset:\s*0;[^}]*z-index:\s*1;[^}]*pointer-events:\s*none;/s);
    expect(css).toMatch(/\.home-atmosphere-layer\s*\{[^}]*position:\s*fixed;[^}]*z-index:\s*2;[^}]*pointer-events:\s*none;/s);
    expect(css).toMatch(/\.main \.profile\.profile--atmosphere\s+\.profile_inner\s*\{[^}]*z-index:\s*3;/s);
    expect(css).not.toContain(".profile__rain-canvas");
  });

  it("keeps the approved sakura particles in light mode", () => {
    const css = stylesheet();
    const atmosphere = rule(css, "\\.home-atmosphere-layer");
    const maskStops = centerMaskStops(atmosphere);

    expect(maskStops).not.toBeNull();
    expect(maskStops?.outer).toBeGreaterThan(maskStops?.inner ?? Number.POSITIVE_INFINITY);
    expect(css).toMatch(/\.home-atmosphere-particle\s*\{[^}]*left:\s*var\(--particle-x\);[^}]*width:\s*var\(--petal-width\);[^}]*height:\s*var\(--petal-length\);[^}]*filter:\s*blur\(var\(--particle-blur\)\);[^}]*animation:\s*homeSakuraFall\s+var\(--petal-duration\)\s+cubic-bezier/s);
    expect(css).toMatch(/\.home-atmosphere-particle::before\s*\{[^}]*height:\s*100%;[^}]*background:\s*radial-gradient[^}]*animation:\s*homeSakuraFlutter\s+var\(--petal-flutter-duration\)/s);

    const sakuraKeyframes = css.slice(
      css.indexOf("@keyframes homeSakuraFall"),
      css.indexOf("@media (prefers-reduced-motion: reduce)"),
    );
    expect(sakuraKeyframes).toContain("18%");
    expect(sakuraKeyframes).toContain("38%");
    expect(sakuraKeyframes).toContain("62%");
    expect(sakuraKeyframes).toContain("82%");
    expect(sakuraKeyframes).toContain("var(--petal-sway-a)");
    expect(sakuraKeyframes).toContain("var(--petal-sway-d)");
    expect(sakuraKeyframes).toContain("@keyframes homeSakuraFlutter");
    expect(sakuraKeyframes).toContain("rotateX(");
    expect(sakuraKeyframes).toContain("rotateY(");
  });

  it("renders two slow mist bands only in the dark forest theme", () => {
    const css = stylesheet();

    expect(css).toMatch(/\.home-atmosphere-layer::before,\s*\.home-atmosphere-layer::after\s*\{[^}]*content:\s*"";[^}]*position:\s*(?:absolute|fixed);[^}]*pointer-events:\s*none;[^}]*opacity:\s*0;[^}]*animation:\s*none;/s);
    expect(css).toMatch(/body\.dark\.list:has\(\.profile--atmosphere\) \.home-atmosphere-layer::before\s*\{[^}]*opacity:\s*0\.[1-9]\d?;[^}]*background:\s*(?:radial|linear)-gradient\([^}]*filter:\s*blur\([^}]*animation:\s*homeForestMist[\w-]*\s+(?:1[89]|2\d|30)s/s);
    expect(css).toMatch(/body\.dark\.list:has\(\.profile--atmosphere\) \.home-atmosphere-layer::after\s*\{[^}]*opacity:\s*0\.[1-9]\d?;[^}]*background:\s*(?:radial|linear)-gradient\([^}]*filter:\s*blur\([^}]*animation:\s*homeForestMist[\w-]*\s+(?:1[89]|2\d|30)s/s);
  });

  it("restyles dark particles as sideways forest debris", () => {
    const css = stylesheet();
    const darkDebris = /body\.dark\.list:has\(\.profile--atmosphere\) \.home-atmosphere-particle::before\s*\{([^}]*)\}/s.exec(css)?.[1] ?? "";
    const mobile = mediaBlockContaining(
      css,
      "max-width:\\s*960px",
      "body.dark.list:has(.profile--atmosphere) .home-atmosphere-particle",
    );

    expect(css).toMatch(/body\.dark\.list:has\(\.profile--atmosphere\) \.home-atmosphere-particle\s*\{[^}]*top:\s*var\(--debris-y\);[^}]*width:\s*var\(--debris-width\);[^}]*height:\s*var\(--debris-length\);[^}]*opacity:\s*var\(--debris-opacity\);[^}]*animation:\s*homeForestDebrisDrift\s+var\(--debris-duration\)[^}]*var\(--debris-delay\)/s);
    expect(darkDebris).toMatch(/background(?:-color)?:\s*[^;]+;/);
    expect(darkDebris).toMatch(/border-radius:[^;}]+;/);
    expect(darkDebris).toMatch(/transform:\s*rotate\(var\(--debris-angle\)\);/);
    expect(darkDebris).toMatch(/animation:\s*none;/);
    expect(darkDebris).not.toMatch(/radial-gradient|--petal-/);
    expect(css).toMatch(/@keyframes\s+homeForestDebrisDrift\s*\{[\s\S]*translate3d\(var\(--debris-drift\),\s*var\(--debris-lift\),\s*0\)[\s\S]*rotate\(var\(--debris-spin\)\)/s);
    expect(mobile).toMatch(/body\.dark\.list:has\(\.profile--atmosphere\) \.home-atmosphere-particle(?::nth-child\([^)]+\))?\s*\{[^}]*(?:display:\s*none|opacity:\s*(?:0\.[0-2]\d?|calc\(var\(--debris-opacity\)\s*\*\s*0\.[1-9]\d?\))|--debris-opacity:\s*0\.[0-2]\d?)/s);
  });

  it("removes the old dark rain language entirely", () => {
    const css = stylesheet();

    expect(css).not.toContain("homeRainDrop");
    expect(css).not.toContain(".home-rain-layer");
    expect(css).not.toContain(".home-rain-drop");
    expect(css).not.toContain("--rain-");
    expect(css).not.toContain("var(--rain-drop-tail)");
    expect(css).not.toContain("var(--rain-drop-color)");
    expect(css).not.toContain("rainyMaskDrops");
    expect(css).not.toContain("rainyMaskStreaks");
  });

  it("hides moving atmosphere particles for reduced motion", () => {
    const css = stylesheet();
    const reducedParticles = mediaBlockContaining(
      css,
      "prefers-reduced-motion:\\s*reduce",
      ".home-atmosphere-particle",
    );
    const reducedMist = mediaBlockContaining(
      css,
      "prefers-reduced-motion:\\s*reduce",
      ".home-atmosphere-layer::before",
    );

    expect(reducedParticles).toMatch(/\.home-atmosphere-particle\s*\{[^}]*display:\s*none;/s);
    expect(reducedMist).toMatch(/\.home-atmosphere-layer::before,\s*\.home-atmosphere-layer::after\s*\{[^}]*animation:\s*none\s*!important;/s);
  });

  it("keeps the subtle ink-wash texture and clear center mask", () => {
    const css = stylesheet();
    const profileMask = rule(css, "\\.main \\.profile\\.profile--atmosphere::before");
    const maskStops = centerMaskStops(profileMask);

    expect(css).toMatch(/\.main \.profile\.profile--atmosphere\s*\{[^}]*--ink-wash-a:/s);
    expect(css).toContain("radial-gradient(24rem 18rem at 14% 16%, var(--ink-wash-a)");
    expect(css).toContain("radial-gradient(22rem 16rem at 86% 82%, var(--ink-wash-b)");
    expect(css).toMatch(/\.main \.profile\.profile--atmosphere::before\s*\{[^}]*-webkit-mask-image:\s*radial-gradient\(/s);
    expect(css).toMatch(/\.main \.profile\.profile--atmosphere::before\s*\{[^}]*mask-image:\s*radial-gradient\(/s);
    expect(css).toMatch(/\.main \.profile\.profile--atmosphere::after\s*\{[^}]*opacity:\s*0\.1[0-9]?;/s);
    expect(maskStops).not.toBeNull();
    expect(maskStops?.outer).toBeGreaterThan(maskStops?.inner ?? Number.POSITIVE_INFINITY);
  });
});
