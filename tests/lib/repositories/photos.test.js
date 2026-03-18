import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createMock,
  findManyMock,
  findFirstMock,
  findUniqueMock,
  updateMock,
  deleteMock,
  getPhotoCategoryByIdMock,
} = vi.hoisted(() => ({
  createMock: vi.fn(),
  findManyMock: vi.fn(),
  findFirstMock: vi.fn(),
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
  getPhotoCategoryByIdMock: vi.fn(),
}));

vi.mock("../../../lib/db", () => ({
  db: {
    photo: {
      create: createMock,
      findMany: findManyMock,
      findFirst: findFirstMock,
      findUnique: findUniqueMock,
      update: updateMock,
      delete: deleteMock,
    },
  },
}));

vi.mock("../../../lib/repositories/photo-categories", () => ({
  getPhotoCategoryById: getPhotoCategoryByIdMock,
}));

import {
  createPhoto,
  deletePhoto,
  getPhotoById,
  listAdminPhotos,
  listPublishedPhotos,
  updatePhoto,
} from "../../../lib/repositories/photos";

describe("photo repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates photos after validating the category", async () => {
    getPhotoCategoryByIdMock.mockResolvedValue({
      id: "photo-category-1",
      name: "Travel",
      slug: "travel",
      status: "PUBLISHED",
    });
    createMock.mockResolvedValue({
      id: "photo-1",
      title: "Sunset",
      imageUrl: "https://blob.example/photos/sunset.jpg",
    });

    const photo = await createPhoto({
      title: "Sunset",
      caption: "Evening light",
      imageUrl: "https://blob.example/photos/sunset.jpg",
      pathname: "photos/sunset.jpg",
      sortOrder: 12,
      categoryId: "photo-category-1",
    });

    expect(getPhotoCategoryByIdMock).toHaveBeenCalledWith("photo-category-1");
    expect(createMock).toHaveBeenCalledWith({
      data: {
        title: "Sunset",
        caption: "Evening light",
        imageUrl: "https://blob.example/photos/sunset.jpg",
        pathname: "photos/sunset.jpg",
        sortOrder: 12,
        categoryId: "photo-category-1",
      },
      include: {
        category: true,
      },
    });
    expect(photo.id).toBe("photo-1");
  });

  it("defaults to the next upload position inside the same album when sort order is omitted", async () => {
    getPhotoCategoryByIdMock.mockResolvedValue({
      id: "photo-category-1",
      name: "Travel",
      slug: "travel",
      status: "PUBLISHED",
    });
    findFirstMock.mockResolvedValue({
      sortOrder: 7,
    });
    createMock.mockResolvedValue({
      id: "photo-2",
      title: "Lanterns",
      imageUrl: "https://blob.example/photos/lanterns.jpg",
    });

    await createPhoto({
      title: "Lanterns",
      caption: "Night market",
      imageUrl: "https://blob.example/photos/lanterns.jpg",
      pathname: "photos/lanterns.jpg",
      categoryId: "photo-category-1",
    });

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { categoryId: "photo-category-1" },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    expect(createMock).toHaveBeenCalledWith({
      data: {
        title: "Lanterns",
        caption: "Night market",
        imageUrl: "https://blob.example/photos/lanterns.jpg",
        pathname: "photos/lanterns.jpg",
        sortOrder: 8,
        categoryId: "photo-category-1",
      },
      include: {
        category: true,
      },
    });
  });

  it("assigns consecutive sort orders when creating multiple photos in one album", async () => {
    getPhotoCategoryByIdMock.mockResolvedValue({
      id: "photo-category-1",
      name: "Travel",
      slug: "travel",
      status: "PUBLISHED",
    });
    findFirstMock.mockResolvedValue({
      sortOrder: 2,
    });
    createMock
      .mockResolvedValueOnce({ id: "photo-3", title: "First" })
      .mockResolvedValueOnce({ id: "photo-4", title: "Second" });

    await createPhoto({
      title: "First",
      imageUrl: "https://blob.example/photos/first.jpg",
      categoryId: "photo-category-1",
    });
    findFirstMock.mockResolvedValue({
      sortOrder: 3,
    });
    await createPhoto({
      title: "Second",
      imageUrl: "https://blob.example/photos/second.jpg",
      categoryId: "photo-category-1",
    });

    expect(createMock).toHaveBeenNthCalledWith(1, expect.objectContaining({
      data: expect.objectContaining({
        title: "First",
        sortOrder: 3,
      }),
    }));
    expect(createMock).toHaveBeenNthCalledWith(2, expect.objectContaining({
      data: expect.objectContaining({
        title: "Second",
        sortOrder: 4,
      }),
    }));
  });

  it("lists admin photos with category details", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "photo-1",
        title: "Sunset",
        status: "DRAFT",
      },
    ]);

    const photos = await listAdminPhotos();

    expect(findManyMock).toHaveBeenCalledWith({
      orderBy: [
        { sortOrder: "asc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        category: true,
      },
    });
    expect(photos[0].title).toBe("Sunset");
  });

  it("lists published photos for the public gallery", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "photo-1",
        title: "Sunset",
      },
    ]);

    const photos = await listPublishedPhotos();

    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        category: {
          status: "PUBLISHED",
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        category: true,
      },
    });
    expect(photos[0].title).toBe("Sunset");
  });

  it("gets a single photo with category details", async () => {
    findUniqueMock.mockResolvedValue({
      id: "photo-1",
      title: "Sunset",
      category: { id: "cat-1", name: "Travel" },
    });

    const photo = await getPhotoById("photo-1");

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: "photo-1" },
      include: {
        category: true,
      },
    });
    expect(photo.title).toBe("Sunset");
  });

  it("updates photo metadata after validating the category", async () => {
    getPhotoCategoryByIdMock.mockResolvedValue({
      id: "photo-category-1",
      name: "Travel",
      slug: "travel",
      status: "PUBLISHED",
    });
    updateMock.mockResolvedValue({
      id: "photo-1",
      title: "Updated Sunset",
    });

    await updatePhoto("photo-1", {
      title: "Updated Sunset",
      caption: "Evening light",
      sortOrder: 6,
      categoryId: "photo-category-1",
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "photo-1" },
      data: {
        title: "Updated Sunset",
        caption: "Evening light",
        sortOrder: 6,
        categoryId: "photo-category-1",
      },
      include: {
        category: true,
      },
    });
  });

  it("deletes a photo by id", async () => {
    deleteMock.mockResolvedValue({ id: "photo-1" });

    await deletePhoto("photo-1");

    expect(deleteMock).toHaveBeenCalledWith({
      where: { id: "photo-1" },
    });
  });
});
