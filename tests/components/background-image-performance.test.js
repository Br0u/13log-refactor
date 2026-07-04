import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const stylesheetPath = path.join(projectRoot, "app/papermod-custom.css");
const backgroundsDir = path.join(projectRoot, "public/images/backgrounds");

describe("background image performance", () => {
  it("serves CSS background PNGs through WebP image-set fallbacks", () => {
    const stylesheet = fs.readFileSync(stylesheetPath, "utf8");
    const pngMatches = [...stylesheet.matchAll(/url\("\/images\/backgrounds\/([^"]+?\.png)"\)/g)];
    const pngNames = [...new Set(pngMatches.map((match) => match[1]))];

    expect(pngNames.length).toBeGreaterThan(0);

    for (const pngName of pngNames) {
      const webpName = pngName.replace(/\.png$/, ".webp");
      const pngPath = path.join(backgroundsDir, pngName);
      const webpPath = path.join(backgroundsDir, webpName);

      expect(stylesheet).toContain(`url("/images/backgrounds/${webpName}") type("image/webp")`);
      expect(stylesheet).toContain(`url("/images/backgrounds/${pngName}") type("image/png")`);
      expect(fs.existsSync(webpPath)).toBe(true);
      expect(fs.statSync(webpPath).size).toBeLessThan(fs.statSync(pngPath).size);
    }
  });
});
