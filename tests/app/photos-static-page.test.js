import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("legacy photos static entry", () => {
  it("redirects the old /photos/index.html entry to the new site-native photos page", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "public/photos/index.html"), "utf8");

    expect(source).toContain('http-equiv="refresh"');
    expect(source).toContain('content="0; url=/photos"');
    expect(source).toContain('window.location.replace("/photos")');
    expect(source).not.toContain("flip-gallery");
  });
});
