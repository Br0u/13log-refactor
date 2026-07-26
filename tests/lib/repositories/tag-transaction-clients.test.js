import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbMock, ensureTagsMock, getCategoryByIdMock, state } = vi.hoisted(() => {
  const state = { transactionClient: null };
  return {
    state,
    ensureTagsMock: vi.fn(),
    getCategoryByIdMock: vi.fn(),
    dbMock: {
      $transaction: vi.fn(async (callback) => callback(state.transactionClient)),
    },
  };
});

vi.mock("../../../lib/db", () => ({
  db: dbMock,
}));

vi.mock("../../../lib/repositories/categories", () => ({
  getCategoryById: getCategoryByIdMock,
}));

vi.mock("../../../lib/repositories/tags", () => ({
  ensureTags: ensureTagsMock,
}));

import { createMicroPost } from "../../../lib/repositories/micro-posts";
import { createPost } from "../../../lib/repositories/posts";

describe("repository tag transaction clients", () => {
  beforeEach(() => {
    dbMock.$transaction.mockClear();
    ensureTagsMock.mockReset();
    getCategoryByIdMock.mockReset();
    getCategoryByIdMock.mockResolvedValue({ id: "category-1" });
    ensureTagsMock.mockResolvedValue([{ id: "tag-1" }]);
  });

  it("passes the post transaction client to ensureTags", async () => {
    const tx = {
      post: {
        create: vi.fn().mockResolvedValue({ id: "post-1" }),
        findUnique: vi.fn().mockResolvedValue({ id: "post-1" }),
      },
      postTag: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    state.transactionClient = tx;

    await createPost({
      title: "Transaction-bound tags",
      slug: "test-13log-unit-post",
      markdown: "body",
      status: "DRAFT",
      categoryId: "category-1",
      tags: ["Backend"],
    });

    expect(ensureTagsMock).toHaveBeenCalledWith(["Backend"], tx);
  });

  it("passes the micro-post transaction client to ensureTags", async () => {
    const tx = {
      microPost: {
        create: vi.fn().mockResolvedValue({ id: "micro-1" }),
        findUnique: vi.fn().mockResolvedValue({ id: "micro-1" }),
      },
      microPostTag: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    state.transactionClient = tx;

    await createMicroPost({
      content: "[test-13log] unit transaction-bound tags",
      status: "DRAFT",
      tags: ["Mood"],
    });

    expect(ensureTagsMock).toHaveBeenCalledWith(["Mood"], tx);
  });
});
