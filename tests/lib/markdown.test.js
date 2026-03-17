import { describe, expect, it } from "vitest";
import {
  buildPlainSummary,
  preprocessShortcodes,
  renderMicroMarkdownToHtml,
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

  it("renders micro markdown with soft line breaks preserved", async () => {
    const html = await renderMicroMarkdownToHtml("第一行\n第二行\n\n- 列表");

    expect(html).toContain("第一行<br>");
    expect(html).toContain("第二行");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>列表</li>");
  });

  it("upgrades a standalone markdown image into a post figure with caption", async () => {
    const html = await renderMarkdownToHtml("![雨夜电台](/images/example.jpg)");

    expect(html).toContain('<figure class="post-figure">');
    expect(html).toContain('class="post-figure__image"');
    expect(html).toContain("<figcaption");
    expect(html).toContain("雨夜电台");
  });

  it("does not wrap mixed-content image paragraphs as post figures", async () => {
    const html = await renderMarkdownToHtml("前文 ![配图](/images/example.jpg) 后文");

    expect(html).not.toContain('<figure class="post-figure">');
    expect(html).toContain("<p>前文");
  });

  it("omits the caption for standalone images without meaningful alt text", async () => {
    const html = await renderMarkdownToHtml("![](/images/example.jpg)");

    expect(html).toContain('<figure class="post-figure">');
    expect(html).not.toContain("<figcaption");
  });
});
