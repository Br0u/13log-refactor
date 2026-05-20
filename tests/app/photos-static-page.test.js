import path from "node:path";
import { describe, expect, it } from "vitest";

describe("legacy photos static entry", () => {
  it("does not ship /photos/index.html because it can shadow the app route on Vercel", () => {
    expect(() => require.resolve(path.join(process.cwd(), "public/photos/index.html"))).toThrow();
  });
});
