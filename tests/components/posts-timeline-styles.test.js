import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("posts timeline styles", () => {
  it("caps the posts timeline at two columns on larger screens", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.posts-masonry\s*\{[^}]*column-count:\s*1;/s);
    expect(stylesheet).toMatch(/@media\s*\(min-width:\s*900px\)\s*\{[\s\S]*\.posts-masonry\s*\{[^}]*column-count:\s*2;/s);
    expect(stylesheet).not.toMatch(/@media\s*\(min-width:\s*1200px\)\s*\{[\s\S]*\.posts-masonry\s*\{[^}]*column-count:\s*3;/s);
  });

  it("switches the posts page timeline into a single-column editorial list mode", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.posts-masonry--posts-list\s*\{[^}]*column-count:\s*1;/s);
    expect(stylesheet).toMatch(/\.posts-masonry--posts-list\s+\.post-preview-card\s*\{[^}]*padding:\s*0\.35rem\s+0\s+0\.2rem;[^}]*border-radius:\s*0;[^}]*background:\s*transparent;[^}]*border:\s*none;[^}]*box-shadow:\s*none;/s);
    expect(stylesheet).toMatch(/\.posts-masonry--posts-list\s+\.post-preview-card__title\s+a,\s*\.posts-masonry--posts-list\s+\.post-preview-card__excerpt-block,\s*\.posts-masonry--posts-list\s+\.post-preview-card__meta\s*\{[^}]*color:\s*color-mix\(in srgb,\s*var\(--secondary\)\s*92%,\s*var\(--content\)\);/s);
    expect(stylesheet).toMatch(/\.posts-masonry--posts-list\.posts-masonry--interactive\[data-micro-focus=""\]\s+\.post-preview-card:hover,\s*\.posts-masonry--posts-list:not\(\.posts-masonry--interactive\)\s+\.post-preview-card:hover\s*\{[^}]*transform:\s*none;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;[^}]*border-color:\s*transparent;/s);
    expect(stylesheet).toMatch(/\.posts-masonry--posts-list\s+\.post-preview-card:hover\s+\.post-preview-card__title\s+a,\s*\.posts-masonry--posts-list\s+\.post-preview-card:hover\s+\.post-preview-card__excerpt-block,\s*\.posts-masonry--posts-list\s+\.post-preview-card:hover\s+\.post-preview-card__meta\s*\{[^}]*color:\s*var\(--primary\);/s);
  });

  it("keeps micro posts carded in the posts list layout", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.posts-masonry--posts-list\s+\.post-preview-card--micro\s*\{[^}]*border-radius:\s*1\.2rem;[^}]*border:\s*none;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s);
    expect(stylesheet).toMatch(/\.posts-masonry--posts-list\s+\.post-preview-card--micro\s+\.post-preview-card__micro-surface\s*\{[^}]*padding:\s*clamp\(1\.02rem,[^}]*border:\s*1px\s+solid\s+color-mix\(in srgb,\s*var\(--border\)\s*16%,\s*rgba\(255,\s*255,\s*255,\s*0\.035\)\);/s);
    expect(stylesheet).toMatch(/\.posts-masonry--posts-list\.posts-masonry--interactive\[data-micro-focus=""\]\s+\.post-preview-card--micro:hover\s+\.post-preview-card__micro-surface,\s*\.posts-masonry--posts-list:not\(\.posts-masonry--interactive\)\s+\.post-preview-card--micro:hover\s+\.post-preview-card__micro-surface\s*\{[^}]*box-shadow:\s*[^}]*0\s+6px\s+16px\s+rgba\(43,\s*34,\s*22,\s*0\.014\)/s);
  });

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

    expect(stylesheet).toMatch(/\.post-preview-card__micro-image\s*\{[^}]*display:\s*block;[^}]*width:\s*auto;[^}]*max-width:\s*100%;[^}]*height:\s*auto;/s);
    expect(stylesheet).toMatch(/\.post-preview-card__micro-image\s*\{[^}]*margin:\s*0\.18rem\s+auto\s+0\.28rem;/s);
    expect(stylesheet).toMatch(/\.post-preview-card__micro-image\s*\{[^}]*border:\s*1px\s+solid\s+color-mix\(in srgb,\s*var\(--primary\)\s*22%,\s*var\(--border\)\);/s);
    expect(stylesheet).toMatch(/\.post-preview-card__micro-image\s*\{[^}]*border-radius:\s*0;/s);
    expect(stylesheet).toMatch(/\.post-preview-card__micro-image\s*\{[^}]*object-fit:\s*contain;/s);
    expect(stylesheet).toMatch(/\.posts-masonry--posts-list\s+\.post-preview-card__micro-image\s*\{[^}]*max-height:\s*12rem;/s);
  });

  it("keeps image micros fully expanded in the posts list layout", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.posts-masonry--posts-list\s+\.post-preview-card--micro-expanded\s*\{[^}]*cursor:\s*default;/s);
    expect(stylesheet).toMatch(/\.posts-masonry--posts-list\s+\.post-preview-card--micro-expanded\s+\.post-preview-card__excerpt-block\s*\{[^}]*overflow:\s*visible;[^}]*max-height:\s*none;/s);
  });

  it("gives long text micros more reading height in the posts list layout", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.posts-masonry--posts-list\s+\.post-preview-card--micro-relaxed\s+\.post-preview-card__excerpt-block\s*\{[^}]*max-height:\s*calc\(1\.74em\s*\*\s*10\);/s);
  });

  it("removes the clickable cursor hint from micro cards in the posts list layout", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.posts-masonry--posts-list\s+\.post-preview-card--micro\s*\{[^}]*cursor:\s*default;/s);
  });

  it("separates posts list cards with a soft ellipsis marker", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.posts-masonry--posts-list\s+\.post-preview-card:not\(:last-child\)::after\s*\{[^}]*content:\s*"\.\.\.";[^}]*display:\s*block;/s);
    expect(stylesheet).toMatch(/\.posts-masonry--posts-list\s+\.post-preview-card:not\(:last-child\)::after\s*\{[^}]*text-align:\s*center;[^}]*color:\s*color-mix\(in srgb,\s*var\(--secondary\)\s*72%,\s*transparent\);/s);
  });

  it("keeps the focused micropost surface mobile-friendly for touch scrolling", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.posts-masonry--interactive\[data-micro-focus\]:not\(\[data-micro-focus=""\]\)\s+\.post-preview-card--micro\.is-micro-active\s+\.post-preview-card__micro-surface\s*\{[^}]*touch-action:\s*pan-y\s+pinch-zoom;[^}]*-webkit-overflow-scrolling:\s*touch;/s);
    expect(stylesheet).toMatch(/\.posts-masonry--posts-list\.posts-masonry--interactive\[data-micro-focus\]:not\(\[data-micro-focus=""\]\)\s+\.post-preview-card--micro\.is-micro-active\s+\.post-preview-card__micro-surface\s*\{[^}]*max-height:\s*min\(24rem,\s*68vh\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.posts-masonry--interactive\[data-micro-focus\]:not\(\[data-micro-focus=""\]\)\s+\.post-preview-card--micro\.is-micro-active\s+\.post-preview-card__micro-surface\s*\{[^}]*max-height:\s*min\(22rem,\s*62vh\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.posts-masonry--posts-list\s+\.post-preview-card__micro-image\s*\{[^}]*max-height:\s*9rem;/s);
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
