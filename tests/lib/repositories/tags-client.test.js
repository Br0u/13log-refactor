import { beforeEach, describe, expect, it, vi } from "vitest";

const { globalUpsert } = vi.hoisted(() => ({
  globalUpsert: vi.fn(),
}));

vi.mock("../../../lib/db", () => ({
  db: {
    tag: {
      upsert: globalUpsert,
    },
  },
}));

import { ensureTags } from "../../../lib/repositories/tags";

describe("ensureTags client boundary", () => {
  beforeEach(() => {
    globalUpsert.mockReset();
  });

  it("creates tags only through the injected transaction client", async () => {
    const transactionUpsert = vi
      .fn()
      .mockResolvedValueOnce({ id: "tag-1", name: "Backend", slug: "backend" })
      .mockResolvedValueOnce({ id: "tag-2", name: "Database", slug: "database" });
    const transactionClient = {
      tag: {
        upsert: transactionUpsert,
      },
    };

    await expect(
      ensureTags(["Backend", "Database"], transactionClient)
    ).resolves.toEqual([
      { id: "tag-1", name: "Backend", slug: "backend" },
      { id: "tag-2", name: "Database", slug: "database" },
    ]);

    expect(transactionUpsert).toHaveBeenNthCalledWith(1, {
      where: { slug: "backend" },
      update: { name: "Backend" },
      create: { name: "Backend", slug: "backend" },
    });
    expect(transactionUpsert).toHaveBeenNthCalledWith(2, {
      where: { slug: "database" },
      update: { name: "Database" },
      create: { name: "Database", slug: "database" },
    });
    expect(globalUpsert).not.toHaveBeenCalled();
  });
});
