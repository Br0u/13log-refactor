import { describe, expect, it } from "vitest";
import { TEST_SLUGS, TEST_CATEGORY_SLUGS, TEST_TAG_SLUGS } from "../../scripts/cleanup-test-data.mjs";

describe("cleanup script constants", () => {
  it("tracks the seeded integration-test records", () => {
    expect(TEST_SLUGS).toContain("repository-test-post");
    expect(TEST_SLUGS).toContain("comments-api-post");
    expect(TEST_CATEGORY_SLUGS).toContain("likes-test");
    expect(TEST_TAG_SLUGS).toContain("unused-tag");
  });
});
