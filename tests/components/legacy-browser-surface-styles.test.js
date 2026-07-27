import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

const stylesheet = fs.readFileSync(
  path.join(process.cwd(), "app/papermod-custom.css"),
  "utf8",
);
const root = postcss.parse(stylesheet);

const legacyBackgrounds = new Map([
  [".blog-layout--posts-index::before", "posts-ink-bg.webp"],
  [".blog-layout--post-detail::before", "posts-ink-bg.webp"],
  [".blog-layout--link-index:not(.playzone-layout)::before", "link-ink-bg.webp"],
  [".playzone-layout::before", "playzone-ink-bg.webp"],
  [".blog-layout--photos-index::before", "photos-ink-bg.webp"],
  [".blog-layout--photo-album::before", "photos-ink-bg.webp"],
  [".about-note-layout--ink::before", "about-ink-bg.webp"],
]);

function rulesMatching(selector) {
  const matches = [];
  root.walkRules((rule) => {
    if (rule.selectors?.includes(selector)) {
      matches.push(rule);
    }
  });
  return matches;
}

describe("legacy browser surface compatibility", () => {
  it("keeps the site header above fixed artwork without relying on :has()", () => {
    const rule = rulesMatching("body > .header").find(
      (candidate) => candidate.parent.type === "root",
    );

    expect(rule).toBeDefined();
    expect(rule.nodes.some((node) => node.prop === "position" && node.value === "relative")).toBe(true);
    expect(rule.nodes.some((node) => node.prop === "z-index" && node.value === "3")).toBe(true);
  });

  it("provides page artwork without requiring :has() support", () => {
    for (const [selector, image] of legacyBackgrounds) {
      const rule = rulesMatching(selector).find(
        (candidate) =>
          candidate.parent.type === "root" &&
          candidate.nodes.some(
            (node) =>
              node.prop === "background" &&
              node.value.includes(`/images/backgrounds/${image}`),
          ),
      );

      expect(rule).toBeDefined();
      expect(rule.nodes.some((node) => node.prop === "content" && node.value === '""')).toBe(true);
      expect(rule.nodes.some((node) => node.prop === "position" && node.value === "fixed")).toBe(true);
      expect(rule.nodes.some((node) => node.prop === "inset" && node.value === "0")).toBe(true);
      expect(rule.nodes.some((node) => node.prop === "z-index" && node.value === "-1")).toBe(true);
      expect(rule.nodes.some((node) => node.prop === "pointer-events" && node.value === "none")).toBe(true);
    }
  });

  it("disables the duplicate fallback artwork when :has() is supported", () => {
    const supportsRule = root.nodes.find(
      (node) =>
        node.type === "atrule" &&
        node.name === "supports" &&
        node.params === "selector(body:has(*))",
    );

    expect(supportsRule).toBeDefined();

    for (const selector of legacyBackgrounds.keys()) {
      const rule = supportsRule.nodes.find(
        (candidate) =>
          candidate.type === "rule" && candidate.selectors.includes(selector),
      );

      expect(rule).toBeDefined();
      expect(rule.nodes.some((node) => node.prop === "content" && node.value === "none")).toBe(true);
    }
  });
});
