import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const stylesheetPath = path.join(projectRoot, "app/papermod-custom.css");
const backgroundsDir = path.join(projectRoot, "public/images/backgrounds");
const compatibilityFallbacks = [
  "about-mobile-profile-card.png",
  "photos-mobile-night-ink-bg.png",
  "posts-mobile-rail-bg.png",
  "posts-mobile-night-rail-bg.png",
];

describe("background image performance", () => {
  it("serves CSS background PNGs through WebP image-set fallbacks", () => {
    const stylesheet = fs.readFileSync(stylesheetPath, "utf8");
    const backgroundPngPattern = /url\("\/images\/backgrounds\/([^"]+?\.png)"\)/g;
    const imageSets = [
      ...stylesheet.matchAll(/image-set\((?:[^()]|\([^()]*\))*\)/g),
    ].map((match) => match[0]);
    const pngMatches = [...stylesheet.matchAll(backgroundPngPattern)];
    const pngNames = [...new Set(pngMatches.map((match) => match[1]))];

    expect(pngNames.length).toBeGreaterThan(0);

    for (const pngName of pngNames) {
      const webpName = pngName.replace(/\.png$/, ".webp");
      const pngPath = path.join(backgroundsDir, pngName);
      const webpPath = path.join(backgroundsDir, webpName);
      const matchingImageSets = imageSets.filter((declaration) =>
        declaration.includes(`url("/images/backgrounds/${pngName}")`),
      );

      const webpCandidate = `url("/images/backgrounds/${webpName}") type("image/webp")`;
      const pngCandidate = `url("/images/backgrounds/${pngName}") type("image/png")`;

      expect(matchingImageSets.length).toBeGreaterThan(0);

      for (const declaration of matchingImageSets) {
        expect(declaration).toContain(webpCandidate);
        expect(declaration).toContain(pngCandidate);
        expect(declaration.indexOf(webpCandidate)).toBeLessThan(
          declaration.indexOf(pngCandidate),
        );
      }
      expect(fs.existsSync(webpPath)).toBe(true);
      expect(fs.statSync(webpPath).size).toBeLessThan(fs.statSync(pngPath).size);
    }

    const stylesheetWithoutImageSets = imageSets.reduce(
      (css, declaration) => css.replace(declaration, ""),
      stylesheet,
    );

    expect(stylesheetWithoutImageSets).not.toMatch(backgroundPngPattern);
  });

  it("places a raw WebP compatibility background before each new image-set", () => {
    const stylesheet = fs.readFileSync(stylesheetPath, "utf8");
    const root = postcss.parse(stylesheet);

    for (const pngName of compatibilityFallbacks) {
      const webpName = pngName.replace(/\.png$/, ".webp");
      const imageSetDeclarations = [];

      root.walkDecls("background", (declaration) => {
        if (
          declaration.value.includes("image-set(") &&
          declaration.value.includes(`url("/images/backgrounds/${pngName}")`)
        ) {
          imageSetDeclarations.push(declaration);
        }
      });

      expect(imageSetDeclarations).toHaveLength(1);

      const imageSetDeclaration = imageSetDeclarations[0];
      const imageSet = imageSetDeclaration.value.match(
        /image-set\((?:[^()]|\([^()]*\))*\)/,
      )?.[0];
      const compatibilityDeclaration = imageSetDeclaration.prev();

      expect(imageSet).toBeDefined();
      expect(compatibilityDeclaration?.type).toBe("decl");
      expect(compatibilityDeclaration?.prop).toBe("background");
      expect(compatibilityDeclaration?.value).toBe(
        imageSetDeclaration.value.replace(
          imageSet,
          `url("/images/backgrounds/${webpName}")`,
        ),
      );
      expect(compatibilityDeclaration?.value).not.toContain(".png");
      expect(compatibilityDeclaration?.value).not.toContain("image-set(");
    }
  });
});
