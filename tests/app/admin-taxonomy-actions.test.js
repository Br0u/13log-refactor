import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePathMock, requireAdminSessionMock } = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  requireAdminSessionMock: vi.fn(),
}));

vi.mock("../../lib/admin-session", () => ({
  requireAdminSession: requireAdminSessionMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import { db } from "../../lib/db";
import { deleteCategoryAction, deleteTagAction } from "../../app/admin/actions";

describe("admin taxonomy actions", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    requireAdminSessionMock.mockResolvedValue({ username: "admin" });

    await db.tag.deleteMany({
      where: {
        slug: {
          in: ["test-13log-tag-unused"],
        },
      },
    });

    await db.category.deleteMany({
      where: {
        slug: {
          in: ["test-13log-admin-empty-category"],
        },
      },
    });
  });

  it("deletes an unused tag", async () => {
    const tag = await db.tag.create({
      data: {
        name: "test-13log-tag-unused",
        slug: "test-13log-tag-unused",
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
        name: "test-13log-admin-empty-category",
        slug: "test-13log-admin-empty-category",
      },
    });

    await deleteCategoryAction(category.id);

    const deleted = await db.category.findUnique({
      where: { id: category.id },
    });

    expect(deleted).toBeNull();
  });
});
