import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("static photos flip-book page", () => {
  it("loads photo batches from the public photos api instead of hardcoded batches", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "public/photos/index.html"), "utf8");

    expect(source).toContain('fetch("/api/photos")');
    expect(source).toContain("async function loadPhotoBatches()");
    expect(source).not.toContain('data-batch="Random"');
    expect(source).not.toContain("const photoBatches = {");
  });
});
