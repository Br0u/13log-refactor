import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import nextConfig from "../next.config.mjs";

describe("next config", () => {
  it("does not route development builds into a custom .next-local directory", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "next.config.mjs"), "utf8");

    expect(source).not.toContain('".next-local"');
  });

  it("uses .next for dev and a separate .next-prod directory for production builds", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "next.config.mjs"), "utf8");

    expect(source).toContain('const isDev = process.env.NODE_ENV === "development";');
    expect(source).toContain('distDir: isDev ? ".next" : ".next-prod"');
    expect(nextConfig.distDir).toBe(".next-prod");
  });

  it("raises the server action body size limit for admin image uploads", () => {
    expect(nextConfig.experimental?.serverActions).toEqual({
      bodySizeLimit: "25mb",
    });
  });
});
