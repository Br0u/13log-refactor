import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const stylesheet = () => fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");
const rule = (css, selector) => new RegExp(`${selector}\\s*\\{([^}]*)\\}`, "s").exec(css)?.[1] ?? "";

describe("home background depth styles", () => {
  it("places the transparent depth root behind rain and homepage content", () => {
    const css = stylesheet();
    const root = rule(css, "\\.home-depth-background");

    expect(root).toMatch(/position:\s*fixed;/);
    expect(root).toMatch(/inset:\s*0;/);
    expect(root).toMatch(/z-index:\s*0;/);
    expect(root).toMatch(/overflow:\s*hidden;/);
    expect(root).toMatch(/pointer-events:\s*none;/);
    expect(root).toMatch(/background:\s*transparent;/);
    expect(root).toMatch(/contain:\s*paint;/);
    expect(rule(css, "\\.home-rain-layer")).toMatch(/z-index:\s*2;/);
    expect(rule(css, "\\.main \\.profile\\.profile--rainy-mask \\.profile_inner")).toMatch(/z-index:\s*3;/);
    expect(rule(css, "body\\.list:has\\(\\.profile--rainy-mask\\) \\.header")).toMatch(
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
    expect(css).toMatch(/\.home-depth-background__layer--far\s*\{[^}]*filter:\s*blur\(var\(--home-depth-far-blur\)\)\s+saturate\(0\.94\);/s);
    expect(css).toMatch(/\.home-depth-background__layer--middle\s*\{[^}]*filter:\s*blur\(var\(--home-depth-middle-blur\)\);/s);
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
    const night = rule(css, "body\\.dark\\.list:has\\(\\.profile--rainy-mask\\) \\.home-depth-background");

    expect(day).toMatch(/--home-depth-middle-mask:\s*linear-gradient\(to bottom, transparent 18%, rgba\(0,0,0,\.36\) 42%, #000 68%\);/);
    expect(day).toMatch(/radial-gradient\(ellipse 52% 76% at 0% 68%, #000 36%, transparent 74%\)[\s\S]*radial-gradient\(ellipse 50% 72% at 100% 72%, #000 34%, transparent 72%\)[\s\S]*transparent 30%/);
    expect(night).toMatch(/--home-depth-middle-mask:\s*linear-gradient\(to bottom, transparent 20%, rgba\(0,0,0,0\.38\) 45%, #000 70%\);/);
    expect(night).toMatch(/--home-depth-front-mask:\s*radial-gradient\(ellipse 54% 78% at 0% 70%, #000 38%, transparent 75%\),\s*radial-gradient\(ellipse 52% 74% at 100% 74%, #000 36%, transparent 73%\),\s*linear-gradient\(to top, #000 0%, transparent 31%\);/s);
    expect(rule(css, "body\\.dark\\.list:has\\(\\.profile--rainy-mask\\) \\.home-depth-background__layer")).toMatch(/background-image:\s*url\("\/images\/backgrounds\/home-night-ink-bg\.webp"\);[\s\S]*background-image:\s*image-set\(url\("\/images\/backgrounds\/home-night-ink-bg\.webp"\) type\("image\/webp"\), url\("\/images\/backgrounds\/home-night-ink-bg\.png"\) type\("image\/png"\)\);/);
    expect(rule(css, "\\.home-depth-background::after")).toMatch(/z-index:\s*4;[\s\S]*pointer-events:\s*none;/);
    expect(rule(css, "\\.home-depth-background::after")).toMatch(/background:\s*linear-gradient\(rgba\(247, 243, 235, 0\.18\), rgba\(247, 243, 235, 0\.18\)\),\s*radial-gradient\(ellipse at center, transparent 42%, rgba\(54, 46, 36, 0\.045\) 100%\);/s);
    expect(rule(css, "body\\.dark\\.list:has\\(\\.profile--rainy-mask\\) \\.home-depth-background::after")).toMatch(/background:\s*linear-gradient\(rgba\(3, 8, 18, 0\.18\), rgba\(3, 8, 18, 0\.2\)\),\s*radial-gradient\(ellipse at center, transparent 40%, rgba\(0, 0, 0, 0\.12\) 100%\);/s);
  });

  it("freezes every depth layer to its safe scale for reduced motion", () => {
    const css = stylesheet();

    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.home-depth-background__layer\s*\{[^}]*transform:\s*scale\(var\(--home-depth-layer-scale\)\)\s*!important;[^}]*will-change:\s*auto\s*!important;/s);
  });
});
