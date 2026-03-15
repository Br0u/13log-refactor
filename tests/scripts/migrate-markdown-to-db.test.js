import { describe, expect, it } from "vitest";
import { toPostPayload } from "../../scripts/migrate-markdown-to-db.mjs";

describe("markdown migration script", () => {
  it("maps markdown entries into post payloads", () => {
    const payload = toPostPayload({
      title: "Imported Post",
      urlSlug: "imported-post",
      description: "import summary",
      content: "# hello",
      categories: ["Life"],
      tags: ["tag-a", "tag-b"],
      date: "2026-03-15T00:00:00.000Z",
    });

    expect(payload.slug).toBe("imported-post");
    expect(payload.summary).toBe("import summary");
    expect(payload.status).toBe("PUBLISHED");
    expect(payload.categoryName).toBe("Life");
    expect(payload.tags).toEqual(["tag-a", "tag-b"]);
  });
});
