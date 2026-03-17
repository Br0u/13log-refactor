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

  it("keeps micro focus transitions lightweight for smoother card scaling", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.posts-masonry--interactive\s+\.post-preview-card\s*\{[^}]*will-change:\s*transform,\s*opacity;/s);
    expect(stylesheet).toMatch(/\.posts-masonry--interactive\[data-micro-focus\]:not\(\[data-micro-focus=""\]\)\s+\.post-preview-card\s*\{[^}]*transform:\s*scale\(0\.98\)\s*translateY\(0\.12rem\);[^}]*opacity:\s*0\.44;/s);
    expect(stylesheet).not.toMatch(/\.posts-masonry--interactive\[data-micro-focus\]:not\(\[data-micro-focus=""\]\)\s+\.post-preview-card\s*\{[^}]*filter:/s);
    expect(stylesheet).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*\.posts-masonry--interactive\[data-micro-focus\]:not\(\[data-micro-focus=""\]\)\s+\.post-preview-card[\s\S]*transform:\s*none;/s);
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
    expect(stylesheet).toMatch(/\.posts-masonry--interactive\[data-micro-focus\]:not\(\[data-micro-focus=""\]\)\s+\.post-preview-card--micro\.is-micro-active\s+\.post-preview-card__micro-surface\s*\{[^}]*position:\s*absolute;[^}]*max-height:\s*var\(--micro-surface-max-height,/s);
    expect(stylesheet).toMatch(/\.post-preview-card__micro-surface\[data-micro-placement="up"\]\s*\{[^}]*top:\s*auto;[^}]*bottom:\s*-[.\d]+rem;/s);
  });

  it("styles micropost images with framed proportional media treatment", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.post-preview-card__micro-image\s*\{[^}]*display:\s*block;[^}]*width:\s*100%;[^}]*height:\s*auto;/s);
    expect(stylesheet).toMatch(/\.post-preview-card__micro-image\s*\{[^}]*border:\s*1px\s+solid\s+[^;]+;/s);
    expect(stylesheet).toMatch(/\.post-preview-card__micro-image\s*\{[^}]*object-fit:\s*contain;/s);
  });

  it("keeps the focused micropost surface mobile-friendly for touch scrolling", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.posts-masonry--interactive\[data-micro-focus\]:not\(\[data-micro-focus=""\]\)\s+\.post-preview-card--micro\.is-micro-active\s+\.post-preview-card__micro-surface\s*\{[^}]*touch-action:\s*pan-y\s+pinch-zoom;[^}]*-webkit-overflow-scrolling:\s*touch;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.posts-masonry--interactive\[data-micro-focus\]:not\(\[data-micro-focus=""\]\)\s+\.post-preview-card--micro\.is-micro-active\s+\.post-preview-card__micro-surface\s*\{[^}]*max-height:\s*min\(22rem,\s*62vh\);/s);
  });

  it("keeps the native scrollbar hidden when the range frame is shown", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.posts-masonry--interactive\[data-micro-focus\]:not\(\[data-micro-focus=""\]\)\s+\.post-preview-card--micro\.is-micro-active\s+\.post-preview-card__micro-surface\s*\{[^}]*scrollbar-width:\s*none;/s);
    expect(stylesheet).toMatch(/\.posts-masonry--interactive\[data-micro-focus\]:not\(\[data-micro-focus=""\]\)\s+\.post-preview-card--micro\.is-micro-active\s+\.post-preview-card__micro-surface\s*\{[^}]*scrollbar-color:\s*[^;]+;/s);
    expect(stylesheet).toMatch(/\.posts-masonry--interactive\[data-micro-focus\]:not\(\[data-micro-focus=""\]\)\s+\.post-preview-card--micro\.is-micro-active\s+\.post-preview-card__micro-surface::-webkit-scrollbar\s*\{[^}]*width:\s*0;[^}]*height:\s*0;/s);
  });

  it("renders a proportional scroll range frame for focused microposts", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.post-preview-card__micro-scroll-range\s*\{[^}]*position:\s*absolute;[^}]*transform:\s*scaleY\(0\.82\);/s);
    expect(stylesheet).toMatch(/\.post-preview-card__micro-scroll-range\s*\{[^}]*opacity:\s*0\.[\d]+;/s);
    expect(stylesheet).toMatch(/\.posts-masonry--interactive\[data-micro-focus\]:not\(\[data-micro-focus=""\]\)\s+\.post-preview-card--micro\.is-micro-active:hover\s+\.post-preview-card__micro-scroll-range\[data-scrollable="true"\]\s*\{[^}]*opacity:\s*0\.[\d]+;/s);
    expect(stylesheet).toMatch(/\.posts-masonry--interactive\[data-micro-focus\]:not\(\[data-micro-focus=""\]\)\s+\.post-preview-card--micro\.is-micro-active\s+\.post-preview-card__micro-scroll-range\[data-scrollable="true"\]\[data-scroll-hint-active="true"\]\s*\{[^}]*opacity:\s*0\.[\d]+;/s);
    expect(stylesheet).toMatch(/\.post-preview-card__micro-scroll-thumb\s*\{[^}]*height:\s*calc\(var\(--micro-scroll-window,\s*0\.24\)\s*\*\s*100%\);/s);
    expect(stylesheet).toMatch(/\.post-preview-card__micro-scroll-thumb\s*\{[^}]*top:\s*calc\(var\(--micro-scroll-progress,\s*0\)\s*\*\s*\(100%\s*-\s*\(var\(--micro-scroll-window,\s*0\.24\)\s*\*\s*100%\)\)\);/s);
  });

  it("styles micropost heart likes as a quiet footer action", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.micro-post-like-button\s*\{[^}]*display:\s*inline-flex;[^}]*background:\s*transparent;/s);
    expect(stylesheet).toMatch(/\.micro-post-like-button__icon\s*\{[^}]*font-size:\s*0\.[\d]+rem;/s);
  });
});
