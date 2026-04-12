import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("image zoom styles", () => {
  it("adds zoom affordances and a softer editorial lightbox treatment", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+\.post-figure__image,\s*[\s\S]*?\.photo-album-image,\s*[\s\S]*?\.post-preview-card__micro-image\s*\{[^}]*cursor:\s*zoom-in;/s);
    expect(stylesheet).toMatch(/\.image-lightbox\s*\{[^}]*background:\s*rgba\(10,\s*10,\s*10,\s*0\.72\);[^}]*backdrop-filter:\s*blur\(6px\);[^}]*opacity:\s*0;[^}]*transition:\s*opacity\s+0\.26s\s+ease;/s);
    expect(stylesheet).toMatch(/\.image-lightbox\.is-visible\s*\{[^}]*opacity:\s*1;/s);
    expect(stylesheet).toMatch(/\.image-lightbox__dialog\s*\{[^}]*padding:\s*0\.65rem;/s);
    expect(stylesheet).toMatch(/\.image-lightbox__image\s*\{[^}]*border-radius:\s*0\.35rem;[^}]*box-shadow:\s*0\s+14px\s+40px\s+rgba\(0,\s*0,\s*0,\s*0\.18\);[^}]*opacity:\s*0;[^}]*transform:\s*scale\(0\.985\);[^}]*transition:\s*opacity\s+0\.24s\s+ease,\s*transform\s+0\.24s\s+ease;/s);
    expect(stylesheet).toMatch(/\.image-lightbox\.is-visible\s+\.image-lightbox__image\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*scale\(1\);/s);
    expect(stylesheet).toMatch(/\.image-lightbox__close\s*\{[^}]*color:\s*rgba\(255,\s*255,\s*255,\s*0\.68\);[^}]*font-size:\s*1\.5rem;[^}]*opacity:\s*0;[^}]*transform:\s*translateY\(-4px\);[^}]*transition:\s*color\s+0\.16s\s+ease,\s*opacity\s+0\.22s\s+ease,\s*transform\s+0\.22s\s+ease;/s);
    expect(stylesheet).toMatch(/\.image-lightbox\.is-visible\s+\.image-lightbox__close\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*translateY\(0\);/s);
    expect(stylesheet).toMatch(/\.image-lightbox__close:hover,\s*\.image-lightbox__close:focus-visible\s*\{[^}]*color:\s*rgba\(255,\s*255,\s*255,\s*0\.96\);/s);
  });
});
