import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("post detail styles", () => {
  it("does not force Ma Shan Zheng onto generic post content containers", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).not.toMatch(/\.post-content\s*\*\s*\{[^}]*Ma Shan Zheng/s);
  });

  it("gives post titles a restrained literary serif treatment", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.post-single\s+\.post-title\s*\{[^}]*font-family:\s*var\(--serif-font\);/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-title\s*\{[^}]*font-weight:\s*800;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-title\s*\{[^}]*line-height:\s*1\.2;/s);
  });

  it("renders blockquotes as quiet editorial callouts instead of heavy cards", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+blockquote\s*\{[^}]*border-left:\s*2px\s+solid\s+[^;]+;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+blockquote\s*\{[^}]*font-style:\s*normal;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+blockquote\s*\{[^}]*box-shadow:\s*none;/s);
  });

  it("keeps the main article body in the same restrained serif family", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.post-single\s+\.post-content,\s*[\s\S]*?\.post-single\s+\.post-content\s+table\s*\{[^}]*font-family:\s*var\(--serif-font\);/s);
    expect(stylesheet).not.toMatch(/\.post-single\s+\.post-content,\s*[\s\S]*?\.post-single\s+\.post-content\s+table\s*\{[^}]*Ma Shan Zheng/s);
  });

  it("refines body copy rhythm for long-form reading", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s*\{[^}]*font-size:\s*1\.14rem;[^}]*line-height:\s*1\.82;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+p\s*\{[^}]*text-indent:\s*2em;[^}]*margin-top:\s*0\.18rem;[^}]*margin-bottom:\s*1\.16rem;/s);
  });

  it("styles rich markdown primitives without forcing them into the body serif", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+:is\(code,\s*kbd,\s*samp,\s*var\)\s*\{[^}]*font-family:\s*var\(--latin-font\)\s*!important;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+mark,[\s\S]*?\.post-single\s+\.post-content\s+ins\s*\{[^}]*box-decoration-break:\s*clone;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+\.task-list-item\s*>\s*input\s*\{[^}]*accent-color:\s*var\(--accent\);/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+table\s*\{[^}]*overflow-x:\s*auto;[^}]*font-variant-numeric:\s*tabular-nums;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+details\s*>\s*summary:focus-visible\s*\{[^}]*outline:\s*2px\s+solid\s+var\(--focus-ring\);/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+rt\s*\{[^}]*font-family:\s*var\(--latin-font\)\s*!important;/s);
  });

  it("keeps in-content headings below the page title in visual weight", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+h1,\s*[\s\S]*?\.post-single\s+\.post-content\s+h4\s*\{[^}]*font-weight:\s*720;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+h1\s*\{[^}]*font-size:\s*1\.72rem;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+h2\s*\{[^}]*font-size:\s*1\.46rem;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+h3\s*\{[^}]*font-size:\s*1\.22rem;/s);
  });

  it("does not enlarge or unindent the first paragraph in blended post layouts", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).not.toMatch(/\.post-single--blended\s+\.post-content\s*>\s*p:first-of-type\s*\{[^}]*font-size:/s);
    expect(stylesheet).not.toMatch(/\.post-single--blended\s+\.post-content\s*>\s*p:first-of-type\s*\{[^}]*text-indent:\s*0;/s);
    expect(stylesheet).not.toMatch(/\.post-single--blended\s+\.post-content\s*>\s*p:first-of-type::first-letter/s);
  });

  it("tightens the article container into a calmer reading column", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.post-single\s*\{[^}]*padding:\s*2\.6rem\s+clamp\(1\.6rem,\s*4\.2vw,\s*3\.4rem\)\s+2\.9rem;[^}]*max-width:\s*min\(100%,\s*48rem\);[^}]*margin:\s*0\s+auto;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-title\s*\{[^}]*max-width:\s*16ch;[^}]*margin:\s*0\s+0\s+1\.2rem;/s);
  });

  it("softens the blended article header and metadata chrome", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.post-single--blended\s+\.post-header\s*\{[^}]*border-bottom:\s*1px\s+solid\s+[^;]+;/s);
    expect(stylesheet).toMatch(/\.post-single--blended\s+\.post-meta\s*\{[^}]*font-family:\s*var\(--serif-font\);/s);
    expect(stylesheet).toMatch(/\.post-single--blended\s+\.post-meta\s*\{[^}]*text-transform:\s*none;/s);
    expect(stylesheet).not.toMatch(/\.post-single--blended\s+\.post-meta::before/s);
  });

  it("removes the decorative first separator and softens code blocks on blended posts", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.post-single--blended\s+\.post-content\s*>\s*p:first-child\s*\+\s*hr\s*\{[^}]*display:\s*none;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+pre\s*\{[^}]*background:\s*color-mix\(in srgb,\s*var\(--primary\)\s*82%,\s*var\(--code-bg\)\);/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+pre\s+code\s*\{[^}]*background:\s*transparent\s*!important;/s);
  });

  it("restyles the related rail as a quiet footer section instead of a side rail", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.post-related-rail\s*\{[^}]*display:\s*block;/s);
    expect(stylesheet).toMatch(/\.post-related-rail\s*\{[^}]*margin:\s*1\.8rem\s+0\s+0;/s);
    expect(stylesheet).not.toMatch(/@media\s*\(min-width:\s*1200px\)\s*\{[\s\S]*\.post-related-rail\s*\{[^}]*position:\s*fixed;/s);
    expect(stylesheet).toMatch(/\.post-related-rail__title\s*\{[^}]*text-align:\s*left;/s);
    expect(stylesheet).toMatch(/\.post-related-rail__title\s*\{[^}]*text-transform:\s*none;/s);
    expect(stylesheet).toMatch(/\.post-related-rail__list\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s);
    expect(stylesheet).toMatch(/\.post-related-rail__title\s*\{[^}]*margin:\s*0\s+0\s+0\.32rem;/s);
    expect(stylesheet).toMatch(/\.post-related-rail__list\s*\{[^}]*column-gap:\s*1\.2rem;/s);
    expect(stylesheet).toMatch(/\.post-related-rail__list\s*\{[^}]*row-gap:\s*0\.08rem;/s);
    expect(stylesheet).toMatch(/\.post-related-rail--blended\s+\.post-related-rail__link\s*\{[^}]*padding:\s*0\.34rem\s+0;[^}]*font-size:\s*0\.88rem;[^}]*line-height:\s*1\.5;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.post-related-rail__list\s*\{[^}]*grid-template-columns:\s*1fr;/s);
  });

  it("styles figure captions like subdued annotations", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+\.post-figure\s*\{[^}]*border:\s*0;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+\.post-figure__image\s*\{[^}]*border:\s*1px\s+solid\s+#111;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+\.post-figure__caption\s*\{[^}]*margin:\s*0\.08rem\s+0\s+0\.08rem;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+\.post-figure__caption\s*\{[^}]*font-family:\s*"LXGW WenKai",\s*"Noto Serif CJK SC",\s*"Source Han Serif SC",\s*"Songti SC",\s*"STSong",\s*"SimSun",\s*serif\s*!important;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+\.post-figure__caption\s*\{[^}]*font-weight:\s*300;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+\.post-figure__caption\s*\{[^}]*color:\s*color-mix\(in srgb,\s*var\(--secondary\)\s*60%,\s*var\(--bg\)\);/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+\.post-figure__caption\s*\{[^}]*font-size:\s*0\.8rem;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+\.post-figure__caption\s*\{[^}]*letter-spacing:\s*0\.0[56]em;/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+\.post-figure__caption\s*\{[^}]*text-align:\s*center;/s);
  });

  it("keeps figure images centered on mobile screens", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*\.post-single\s+\.post-content\s+\.post-figure\s*\{[^}]*margin:\s*1\.6rem\s+auto\s+1\.75rem;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*\.post-single\s+\.post-content\s+\.post-figure__caption\s*\{[^}]*margin:\s*0\.04rem\s+0\s+0\.06rem;[^}]*color:\s*color-mix\(in srgb,\s*var\(--secondary\)\s*56%,\s*var\(--bg\)\);[^}]*font-size:\s*0\.76rem;/s);
  });

  it("lays out paired post figures side by side and stacks them on mobile", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+\.post-figure-pair\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s);
    expect(stylesheet).toMatch(/\.post-single\s+\.post-content\s+\.post-figure--paired\s*\{[^}]*max-width:\s*none;/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*\.post-single\s+\.post-content\s+\.post-figure-pair\s*\{[^}]*grid-template-columns:\s*1fr;/s);
  });
});
