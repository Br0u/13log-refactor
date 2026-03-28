import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("client enhancements", () => {
  it("does not keep posts filter navigation inside the global enhancements bundle", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/components/ClientEnhancements.js"), "utf8");

    expect(source).not.toContain("function initPostsFilter()");
    expect(source).not.toContain("cleanups.push(initPostsFilter())");
    expect(source).not.toContain("window.location.assign(target)");
  });

  it("keeps heavy page enhancement initializers in dedicated modules", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/components/ClientEnhancements.js"), "utf8");

    expect(source).toContain('from "./client-enhancements/contentEnhancements"');
    expect(source).toContain('from "./client-enhancements/linkPreview"');
    expect(source).toContain('from "./client-enhancements/tocRail"');
    expect(source).not.toContain("function initSpoilersAndPlaylist()");
    expect(source).not.toContain("function initTocRail()");
    expect(source).not.toContain("function initLinkPreview()");
  });

  it("only mounts TOC and link preview enhancers on routes that actually need them", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/components/ClientEnhancements.js"), "utf8");

    expect(source).toContain('const isPostPage = pathname.startsWith("/posts/")');
    expect(source).toContain('const isLinkPage = pathname === "/link" || pathname.startsWith("/link/")');
    expect(source).toContain("if (isPostPage || isLinkPage) {");
    expect(source).toContain("cleanups.push(initTocRail())");
    expect(source).toContain("if (isLinkPage) {");
    expect(source).toContain("initLinkPreview()");
  });
});
