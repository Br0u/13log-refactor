import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { centerMaskStops, mediaBlockContaining } from "../helpers/css-rules";

const stylesheet = () => fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");
const rule = (css, selector) => new RegExp(`${selector}\\s*\\{([^}]*)\\}`, "s").exec(css)?.[1] ?? "";

describe("home background depth styles", () => {
  it("places the transparent depth root behind atmosphere and homepage content", () => {
    const css = stylesheet();
    const root = rule(css, "\\.home-depth-background");

    expect(root).toMatch(/position:\s*fixed;/);
    expect(root).toMatch(/inset:\s*0;/);
    expect(root).toMatch(/z-index:\s*0;/);
    expect(root).toMatch(/overflow:\s*hidden;/);
    expect(root).toMatch(/pointer-events:\s*none;/);
    expect(root).toMatch(/background:\s*transparent;/);
    expect(root).toMatch(/contain:\s*paint;/);
    expect(rule(css, "\\.home-atmosphere-layer")).toMatch(/z-index:\s*2;/);
    expect(rule(css, "\\.main \\.profile\\.profile--atmosphere \\.profile_inner")).toMatch(/z-index:\s*3;/);
    expect(rule(css, "body\\.list:has\\(\\.profile--atmosphere\\) \\.header")).toMatch(
      /position:\s*relative;[\s\S]*z-index:\s*3;/,
    );
  });

  it("balances desktop depth transforms and image fallbacks", () => {
    const css = stylesheet();
    const root = rule(css, "\\.home-depth-background");
    const layer = rule(css, "\\.home-depth-background__layer");

    expect(root).toMatch(/--home-depth-layer-scale:\s*1\.045;/);
    expect(root).toMatch(/--home-depth-far-blur:\s*1\.8px;/);
    expect(root).toMatch(/--home-depth-middle-blur:\s*0\.55px;/);
    expect(layer).toMatch(/background-image:\s*url\("\/images\/backgrounds\/home-ink-landscape\.webp"\);[\s\S]*background-image:\s*image-set\(url\("\/images\/backgrounds\/home-ink-landscape\.webp"\) type\("image\/webp"\), url\("\/images\/backgrounds\/home-ink-landscape\.png"\) type\("image\/png"\)\);/);
    expect(css).toMatch(/\.home-depth-background__layer--far\s*\{[^}]*translate3d\(calc\(var\(--home-depth-x\) \* -2\.5px\),\s*calc\(var\(--home-depth-y\) \* -1\.8px\),\s*0\)[\s\S]*scale\(var\(--home-depth-layer-scale\)\)/s);
    expect(css).toMatch(/\.home-depth-background__layer--middle\s*\{[^}]*translate3d\(calc\(var\(--home-depth-x\) \* 7px\),\s*calc\(var\(--home-depth-y\) \* 5px\),\s*0\)[\s\S]*scale\(var\(--home-depth-layer-scale\)\)/s);
    expect(css).toMatch(/\.home-depth-background__layer--front\s*\{[^}]*translate3d\(calc\(var\(--home-depth-x\) \* 12px\),\s*calc\(var\(--home-depth-y\) \* 9px\),\s*0\)[\s\S]*scale\(var\(--home-depth-layer-scale\)\)/s);
    expect(css).toMatch(/\.home-depth-background__layer--far\s*\{[^}]*filter:\s*blur\(var\(--home-depth-far-blur\)\)\s+saturate\(0\.88\)\s+brightness\(1\.04\);/s);
    expect(css).toMatch(/\.home-depth-background__layer--middle\s*\{[^}]*filter:\s*blur\(var\(--home-depth-middle-blur\)\)\s+saturate\(0\.95\)\s+brightness\(1\.015\);/s);
  });

  it("adds a non-interactive sakura foreground while keeping the center readable", () => {
    const css = stylesheet();
    const sakura = rule(css, "\\.home-depth-background__sakura");
    const mobile = mediaBlockContaining(css, "max-width:\\s*960px", ".home-depth-background__sakura");
    const reduced = mediaBlockContaining(
      css,
      "prefers-reduced-motion:\\s*reduce",
      ".home-depth-background__sakura",
    );

    expect(sakura).toMatch(/position:\s*absolute;/);
    expect(sakura).toMatch(/pointer-events:\s*none;/);
    expect(sakura).toMatch(/home-sakura-foreground\.webp/);
    expect(sakura).toMatch(/home-sakura-foreground\.png/);
    expect(sakura).toMatch(/clip-path:\s*inset\(8rem 0 0\);/);
    expect(sakura).toMatch(/mask-image:\s*radial-gradient\(/);
    expect(sakura).toMatch(/translate3d\(calc\(var\(--home-depth-x\) \* 18px\),\s*calc\(var\(--home-depth-y\) \* 14px\),\s*0\)/);
    expect(css).toMatch(/body\.dark\.list:has\(\.profile--atmosphere\) \.home-depth-background__sakura\s*\{[^}]*display:\s*none;/s);
    expect(mobile).toMatch(/\.home-depth-background__sakura\s*\{[^}]*opacity:\s*0\.4[0-9];/s);
    expect(reduced).toMatch(/\.home-depth-background__sakura\s*\{[^}]*will-change:\s*auto\s*!important;/s);
  });

  it("adds a dark-only conifer foreground without blocking the center", () => {
    const css = stylesheet();
    const sequoia = rule(css, "\\.home-depth-background__sequoia");
    const parallax = /translate3d\(calc\(var\(--home-depth-x\) \* (\d+(?:\.\d+)?)px\),\s*calc\(var\(--home-depth-y\) \* (\d+(?:\.\d+)?)px\),\s*0\)/.exec(sequoia);
    const maskStops = centerMaskStops(sequoia);
    const mobile = mediaBlockContaining(css, "max-width:\\s*960px", ".home-depth-background__sequoia");
    const reduced = mediaBlockContaining(
      css,
      "prefers-reduced-motion:\\s*reduce",
      ".home-depth-background__sequoia",
    );

    expect(sequoia).toMatch(/position:\s*absolute;/);
    expect(sequoia).toMatch(/pointer-events:\s*none;/);
    expect(sequoia).toMatch(/display:\s*none;/);
    expect(sequoia).toMatch(/home-sequoia-foreground\.webp/);
    expect(sequoia).toMatch(/home-sequoia-foreground\.png/);
    expect(maskStops).not.toBeNull();
    expect(maskStops?.outer).toBeGreaterThan(maskStops?.inner ?? Number.POSITIVE_INFINITY);
    expect(parallax).not.toBeNull();
    expect(Number(parallax?.[1])).toBeGreaterThan(12);
    expect(Number(parallax?.[2])).toBeGreaterThan(9);
    expect(css).toMatch(/body\.dark\.list:has\(\.profile--atmosphere\) \.home-depth-background__sequoia\s*\{[^}]*display:\s*block;/s);
    expect(mobile).toMatch(/\.home-depth-background__sequoia\s*\{[^}]*opacity:\s*0\.[2-5]\d?;/s);
    expect(reduced).toMatch(/\.home-depth-background__sequoia\s*\{[^}]*will-change:\s*auto\s*!important;/s);
  });

  it("adds restrained branch breathing and deeper night separation", () => {
    const css = stylesheet();
    const sakura = rule(css, "\\.home-depth-background__sakura");
    const sequoia = rule(css, "\\.home-depth-background__sequoia");
    const nightFar = rule(
      css,
      "body\\.dark\\.list:has\\(\\.profile--atmosphere\\) \\.home-depth-background__layer--far",
    );
    const nightMiddle = rule(
      css,
      "body\\.dark\\.list:has\\(\\.profile--atmosphere\\) \\.home-depth-background__layer--middle",
    );
    const reduced = mediaBlockContaining(
      css,
      "prefers-reduced-motion:\\s*reduce",
      ".home-depth-background__sakura",
    );

    expect(sakura).toMatch(/animation:\s*homeBranchBreathe\s+12s\s+ease-in-out\s+infinite\s+alternate;/);
    expect(sequoia).toMatch(/animation:\s*homeBranchBreathe\s+16s\s+ease-in-out\s+infinite\s+alternate-reverse;/);
    expect(css).toMatch(/@keyframes\s+homeBranchBreathe\s*\{[\s\S]*translate:\s*0\s+var\(--home-branch-breathe-y\);[\s\S]*rotate:\s*var\(--home-branch-breathe-rotate\);/s);
    expect(nightFar).toMatch(/filter:\s*blur\(var\(--home-depth-far-blur\)\)\s+saturate\(0\.78\)\s+brightness\(0\.88\);/);
    expect(nightMiddle).toMatch(/filter:\s*blur\(var\(--home-depth-middle-blur\)\)\s+saturate\(0\.9\)\s+brightness\(0\.96\);/);
    expect(reduced).toMatch(/\.home-depth-background__sakura,[\s\S]*\.home-depth-background__sequoia\s*\{[^}]*animation:\s*none\s*!important;[^}]*translate:\s*none\s*!important;[^}]*rotate:\s*none\s*!important;/s);
  });

  it("uses safe opaque fallback layers until masking is supported", () => {
    const css = stylesheet();

    expect(rule(css, "\\.home-depth-background__layer--fallback")).toMatch(/opacity:\s*1;[\s\S]*scale\(var\(--home-depth-layer-scale\)\)/);
    expect(css).toMatch(/\.home-depth-background__layer--far,\s*\.home-depth-background__layer--middle,\s*\.home-depth-background__layer--front\s*\{[^}]*opacity:\s*0;/s);
    expect(css).toMatch(/@supports\s*\(mask-image:\s*linear-gradient\(black, transparent\)\)\s*or\s*\(-webkit-mask-image:\s*linear-gradient\(black, transparent\)\)\s*\{[\s\S]*?\.home-depth-background__layer--fallback\s*\{[^}]*opacity:\s*0;[\s\S]*?\.home-depth-background__layer--far,[\s\S]*?\.home-depth-background__layer--front\s*\{[^}]*opacity:\s*1;[^}]*will-change:\s*transform;/s);
    expect(css).toMatch(/\.home-depth-background__layer--middle\s*\{[^}]*-webkit-mask-image:\s*var\(--home-depth-middle-mask\);[\s\S]*mask-image:\s*var\(--home-depth-middle-mask\);/s);
    expect(css).toMatch(/\.home-depth-background__layer--front\s*\{[^}]*-webkit-mask-image:\s*var\(--home-depth-front-mask\);[\s\S]*mask-image:\s*var\(--home-depth-front-mask\);/s);
  });

  it("uses distinct desktop day and night masks plus balanced tints", () => {
    const css = stylesheet();
    const day = rule(css, "\\.home-depth-background");
    const night = rule(css, "body\\.dark\\.list:has\\(\\.profile--atmosphere\\) \\.home-depth-background");

    expect(day).toMatch(/--home-depth-middle-mask:\s*linear-gradient\(to bottom, transparent 18%, rgba\(0,0,0,\.36\) 42%, #000 68%\);/);
    expect(day).toMatch(/radial-gradient\(ellipse 52% 76% at 0% 68%, #000 36%, transparent 74%\)[\s\S]*radial-gradient\(ellipse 50% 72% at 100% 72%, #000 34%, transparent 72%\)[\s\S]*transparent 30%/);
    expect(night).toMatch(/--home-depth-middle-mask:\s*linear-gradient\(to bottom, transparent 20%, rgba\(0,0,0,0\.38\) 45%, #000 70%\);/);
    expect(night).toMatch(/--home-depth-front-mask:\s*radial-gradient\(ellipse 54% 78% at 0% 70%, #000 38%, transparent 75%\),\s*radial-gradient\(ellipse 52% 74% at 100% 74%, #000 36%, transparent 73%\),\s*linear-gradient\(to top, #000 0%, transparent 31%\);/s);
    expect(rule(css, "body\\.dark\\.list:has\\(\\.profile--atmosphere\\) \\.home-depth-background__layer")).toMatch(/background-image:\s*url\("\/images\/backgrounds\/home-night-ink-bg\.webp"\);[\s\S]*background-image:\s*image-set\(url\("\/images\/backgrounds\/home-night-ink-bg\.webp"\) type\("image\/webp"\), url\("\/images\/backgrounds\/home-night-ink-bg\.png"\) type\("image\/png"\)\);/);
    expect(rule(css, "\\.home-depth-background::after")).toMatch(/z-index:\s*5;[\s\S]*pointer-events:\s*none;/);
    expect(rule(css, "\\.home-depth-background::after")).toMatch(/background:\s*linear-gradient\(rgba\(247, 243, 235, 0\.18\), rgba\(247, 243, 235, 0\.18\)\),\s*radial-gradient\(ellipse at center, transparent 42%, rgba\(54, 46, 36, 0\.045\) 100%\);/s);
    expect(rule(css, "body\\.dark\\.list:has\\(\\.profile--atmosphere\\) \\.home-depth-background::after")).toMatch(/background:\s*linear-gradient\(rgba\([^)]*\),\s*rgba\([^)]*\)\),\s*radial-gradient\(ellipse at center, transparent \d+%, rgba\([^)]*\) 100%\);/s);
  });

  it("freezes every depth layer to its safe scale for reduced motion", () => {
    const css = stylesheet();
    const reduced = mediaBlockContaining(
      css,
      "prefers-reduced-motion:\\s*reduce",
      ".home-depth-background__layer",
    );

    expect(reduced).toMatch(/\.home-depth-background__layer\s*\{[^}]*transform:\s*scale\(var\(--home-depth-layer-scale\)\)\s*!important;[^}]*will-change:\s*auto\s*!important;/s);
  });
});
