import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("posts timeline styles", () => {
  it("adds a soft backdrop layer when a micro post is focused", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.posts-masonry--interactive\s*\{[^}]*position:\s*relative;[^}]*isolation:\s*isolate;/s);
    expect(stylesheet).toMatch(/\.posts-masonry--interactive::before\s*\{[^}]*content:\s*"";[^}]*pointer-events:\s*none;/s);
    expect(stylesheet).toMatch(/\.posts-masonry--interactive\[data-micro-focus\]:not\(\[data-micro-focus=""\]\)::before\s*\{[^}]*opacity:\s*[.\d]+;/s);
  });

  it("adds a decorative quote mark to micro post cards", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.post-preview-card--micro::before\s*\{[^}]*content:\s*"["“]";/s);
    expect(stylesheet).toMatch(/\.post-preview-card--micro::before\s*\{[^}]*opacity:\s*0\.[\d]+;/s);
    expect(stylesheet).toMatch(/\.post-preview-card--micro::before\s*\{[^}]*text-shadow:\s*[^;]+;/s);
  });

  it("floats the active micro post surface above the layout instead of expanding document flow", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.post-preview-card--micro\s+\.post-preview-card__micro-surface\s*\{[^}]*display:\s*grid;/s);
    expect(stylesheet).toMatch(/\.posts-masonry--interactive\[data-micro-focus\]:not\(\[data-micro-focus=""\]\)\s+\.post-preview-card--micro\.is-micro-active\s+\.post-preview-card__micro-surface\s*\{[^}]*position:\s*absolute;[^}]*max-height:\s*min\(/s);
  });
});
