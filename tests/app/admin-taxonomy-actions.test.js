import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../../lib/db";
import { deleteCategoryAction, deleteTagAction } from "../../app/admin/actions";

describe("admin taxonomy actions", () => {
  beforeEach(async () => {
    await db.tag.deleteMany({
      where: {
        slug: {
          in: ["unused-tag"],
        },
      },
    });

    await db.category.deleteMany({
      where: {
        slug: {
          in: ["empty-category"],
        },
      },
    });
  });

  it("deletes an unused tag", async () => {
    const tag = await db.tag.create({
      data: {
        name: "Unused Tag",
        slug: "unused-tag",
      },
    });

    await deleteTagAction(tag.id);

    const deleted = await db.tag.findUnique({
      where: { id: tag.id },
    });

    expect(deleted).toBeNull();
  });

  it("deletes an empty category", async () => {
    const category = await db.category.create({
      data: {
        name: "Empty Category",
        slug: "empty-category",
      },
    });

    await deleteCategoryAction(category.id);

    const deleted = await db.category.findUnique({
      where: { id: category.id },
    });

    expect(deleted).toBeNull();
  });
});
