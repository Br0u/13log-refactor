import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function projectPath(relativePath) {
  return path.join(projectRoot, relativePath);
}

function collectFiles(directory, extensionPattern) {
  return fs.readdirSync(projectPath(directory), { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectFiles(relativePath, extensionPattern);
    }

    return extensionPattern.test(entry.name) ? [relativePath] : [];
  });
}

function collectSourceFiles(directory) {
  return collectFiles(directory, /\.(?:css|js|jsx|ts|tsx)$/);
}

describe("component and public resource deduplication", () => {
  it("keeps HtmlContent in one canonical module", () => {
    expect(fs.existsSync(projectPath("app/components/HtmlContent.js"))).toBe(true);
    expect(fs.existsSync(projectPath("app/components/HtmlContent.jsx"))).toBe(false);

    for (const relativePath of collectSourceFiles("app")) {
      const source = fs.readFileSync(projectPath(relativePath), "utf8");
      expect(source, relativePath).not.toMatch(/components\/HtmlContent\.jsx/);
    }
  });

  it("removes unused placeholder components", () => {
    expect(fs.existsSync(projectPath("app/components/VisitTracker.jsx"))).toBe(false);
    expect(fs.existsSync(projectPath("components/ui/demo.tsx"))).toBe(false);
  });

  it("keeps only the public image copies used by production sources", () => {
    const duplicatePaths = [
      "public/assets/pics/about/tx.jpg",
      "public/assets/pics/postpic/zj1.jpg",
      "public/assets/pics/postpic/zj2.jpg",
    ];
    const canonicalPaths = [
      "public/pics/about/tx.jpg",
      "public/pics/postpic/zj1.jpg",
      "public/pics/postpic/zj2.jpg",
    ];

    for (const relativePath of duplicatePaths) {
      expect(fs.existsSync(projectPath(relativePath)), relativePath).toBe(false);
    }

    for (const relativePath of canonicalPaths) {
      expect(fs.existsSync(projectPath(relativePath)), relativePath).toBe(true);
    }

    const productionSource = [
      ...["app", "components", "lib"].flatMap(collectSourceFiles),
      ...collectFiles("content", /\.(?:html|markdown|md)$/),
    ]
      .map((relativePath) => fs.readFileSync(projectPath(relativePath), "utf8"))
      .join("\n");

    expect(productionSource).not.toMatch(/\/assets\/pics\/(?:about\/tx|postpic\/zj[12])\.jpg/);
    expect(productionSource).toContain("/pics/about/tx.jpg");
    expect(productionSource).toContain("/pics/postpic/zj1.jpg");
    expect(productionSource).toContain("/pics/postpic/zj2.jpg");
  });
});
