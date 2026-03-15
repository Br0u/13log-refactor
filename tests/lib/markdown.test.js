import { describe, expect, it } from "vitest";
import {
  buildPlainSummary,
  preprocessShortcodes,
  renderMarkdownToHtml,
  withHeadingAnchors,
} from "../../lib/markdown";

describe("markdown helpers", () => {
  it("renders markdown headings and appends anchor links", async () => {
    const html = await renderMarkdownToHtml("# Title");
    const anchored = withHeadingAnchors(html);

    expect(anchored).toContain("<h1");
    expect(anchored).toContain('href="#title"');
  });

  it("preprocesses supported shortcodes before rendering", () => {
    const processed = preprocessShortcodes('{{< details "More" >}}hello{{< /details >}}');

    expect(processed).toContain("<details>");
    expect(processed).toContain("<summary>More</summary>");
  });

  it("builds a plain-text summary from markdown and html content", () => {
    const summary = buildPlainSummary("## Title\n\nA **bold** paragraph with [link](https://example.com).");

    expect(summary).toContain("Title");
    expect(summary).toContain("A bold paragraph");
    expect(summary).not.toContain("**");
  });
});
