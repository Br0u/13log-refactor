import { afterEach, describe, expect, it } from "vitest";
import { db } from "../../../lib/db";
import { ensureTags } from "../../../lib/repositories/tags";

const ROLLBACK_TAG_SLUG = "test-13log-transaction-rollback";

describe("tag repository transaction integration", () => {
  afterEach(async () => {
    await db.tag.deleteMany({
      where: { slug: ROLLBACK_TAG_SLUG },
    });
  });

  it("rolls back a tag created through the transaction client", async () => {
    await db.tag.deleteMany({
      where: { slug: ROLLBACK_TAG_SLUG },
    });

    await expect(
      db.$transaction(async (tx) => {
        await ensureTags([ROLLBACK_TAG_SLUG], tx);
        throw new Error("force rollback");
      })
    ).rejects.toThrow("force rollback");

    await expect(
      db.tag.findUnique({ where: { slug: ROLLBACK_TAG_SLUG } })
    ).resolves.toBeNull();
  });
});
