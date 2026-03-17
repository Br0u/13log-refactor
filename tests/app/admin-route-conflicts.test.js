import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function collectPages(rootDir, currentDir = "", pages = []) {
  const absoluteDir = path.join(rootDir, currentDir);

  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const nextRelative = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      collectPages(rootDir, nextRelative, pages);
      continue;
    }

    if (!entry.isFile()) continue;
    if (!/^page\.(js|jsx|ts|tsx)$/.test(entry.name)) continue;

    const route = `/${nextRelative}`
      .replace(/\\/g, "/")
      .replace(/\/page\.(js|jsx|ts|tsx)$/, "")
      .replace(/\/\([^/]+\)/g, "");

    pages.push({
      file: nextRelative.replace(/\\/g, "/"),
      route: route || "/",
    });
  }

  return pages;
}

describe("app routes", () => {
  it("does not define duplicate page routes across route groups or legacy duplicates", () => {
    const appDir = path.join(process.cwd(), "app");
    const pages = collectPages(appDir);
    const routes = new Map();

    for (const page of pages) {
      const matches = routes.get(page.route) || [];
      matches.push(page.file);
      routes.set(page.route, matches);
    }

    const duplicates = Array.from(routes.entries())
      .filter(([, files]) => files.length > 1)
      .map(([route, files]) => ({ route, files }));

    expect(duplicates).toEqual([]);
  });

  it("does not keep backup page files that leak into production routes", () => {
    const appDir = path.join(process.cwd(), "app");
    const pages = collectPages(appDir);
    const backupLikePages = pages.filter((page) => / \d+\/page\.(js|jsx|ts|tsx)$/.test(page.file));

    expect(backupLikePages).toEqual([]);
  });
});
