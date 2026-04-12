import { beforeEach, describe, expect, it, vi } from "vitest";

const { createMock, findManyMock, findUniqueMock, updateMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  findManyMock: vi.fn(),
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("../../../lib/db", () => ({
  db: {
    photoCategory: {
      create: createMock,
      findMany: findManyMock,
      findUnique: findUniqueMock,
      update: updateMock,
    },
  },
}));

import {
  createPhotoCategory,
  getPhotoCategoryById,
  listPhotoCategories,
  updatePhotoCategory,
} from "../../../lib/repositories/photo-categories";

describe("photo category repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates photo categories with a nullable description", async () => {
    createMock.mockResolvedValue({
      id: "photo-category-1",
      name: "Travel",
      slug: "travel",
      description: null,
      sortOrder: 3,
    });

    const category = await createPhotoCategory({
      name: "Travel",
      slug: "travel",
      albumAnnotation: "注释词",
      displayTitle: "「世界は　ただ通り過ぎていく」",
      coverTitle: "「世界は　ただ通り過ぎていく」",
      indexDescription: "車窗之外，世界剛好經過。\n沒有停留，也沒有帶走什麼。",
      detailDescription: "車窗之外，世界剛好經過。\n沒有停留，也沒有帶走什麼。",
      status: "PUBLISHED",
      sortOrder: 3,
    });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        name: "Travel",
        slug: "travel",
        description: null,
        albumAnnotation: "注释词",
        displayTitle: "「世界は　ただ通り過ぎていく」",
        coverTitle: "「世界は　ただ通り過ぎていく」",
        indexDescription: "車窗之外，世界剛好經過。\n沒有停留，也沒有帶走什麼。",
        detailDescription: "車窗之外，世界剛好經過。\n沒有停留，也沒有帶走什麼。",
        status: "PUBLISHED",
        sortOrder: 3,
      },
    });
    expect(category.id).toBe("photo-category-1");
  });

  it("lists photo categories by sort order and then name", async () => {
    findManyMock.mockResolvedValue([
      { id: "photo-category-1", name: "Travel", slug: "travel" },
    ]);

    const categories = await listPhotoCategories({ status: "PUBLISHED" });

    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        status: "PUBLISHED",
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });
    expect(categories[0].slug).toBe("travel");
  });

  it("finds a photo category by id", async () => {
    findUniqueMock.mockResolvedValue({
      id: "photo-category-1",
      name: "Travel",
      slug: "travel",
    });

    const category = await getPhotoCategoryById("photo-category-1");

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: "photo-category-1" },
    });
    expect(category.name).toBe("Travel");
  });

  it("updates an existing photo category", async () => {
    updateMock.mockResolvedValue({
      id: "photo-category-1",
      name: "April",
      slug: "april",
      sortOrder: 1,
    });

    const category = await updatePhotoCategory("photo-category-1", {
      name: "April",
      slug: "april",
      albumAnnotation: "四月",
      displayTitle: "「四月的空氣」",
      coverTitle: "「四月的空氣」",
      indexDescription: "光線變輕了。\n風裡開始有新的氣味。",
      detailDescription: "光線變輕了。\n風裡開始有新的氣味。",
      status: "DRAFT",
      sortOrder: 1,
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "photo-category-1" },
      data: {
        name: "April",
        slug: "april",
        description: null,
        albumAnnotation: "四月",
        displayTitle: "「四月的空氣」",
        coverTitle: "「四月的空氣」",
        indexDescription: "光線變輕了。\n風裡開始有新的氣味。",
        detailDescription: "光線變輕了。\n風裡開始有新的氣味。",
        status: "DRAFT",
        sortOrder: 1,
      },
    });
    expect(category.slug).toBe("april");
  });
});
