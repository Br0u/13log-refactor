import { describe, expect, it } from "vitest";

import nextConfig from "../next.config.mjs";

describe("next config", () => {
  it("raises the server action body size limit for admin image uploads", () => {
    expect(nextConfig.experimental?.serverActions).toEqual({
      bodySizeLimit: "25mb",
    });
  });
});
