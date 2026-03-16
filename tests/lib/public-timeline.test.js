import { describe, expect, it } from "vitest";
import * as publicContent from "../../lib/public-content";

describe("public timeline facade", () => {
  it("exposes a mixed timeline query for posts and micro posts", () => {
    expect(typeof publicContent.getPublicTimelineEntries).toBe("function");
  });
});
