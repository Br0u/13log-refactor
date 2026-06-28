import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("blog rail border styles", () => {
  it("frames the left blog rail with a transparent black outline", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/\.blog-rail\s*\{[^}]*padding:\s*clamp\(0\.9rem,[^}]*border:\s*1px\s+solid\s+#000;[^}]*border-radius:\s*0\.35rem;[^}]*background:\s*transparent;[^}]*box-shadow:\s*0\.42rem\s+0\.42rem\s+0\s+#000;/s);
  });
});
