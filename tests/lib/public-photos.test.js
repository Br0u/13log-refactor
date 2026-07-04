import { beforeEach, describe, expect, it, vi } from "vitest";

const { listPhotoCategoriesMock, listPublishedPhotosMock } = vi.hoisted(() => ({
  listPhotoCategoriesMock: vi.fn(),
  listPublishedPhotosMock: vi.fn(),
}));

vi.mock("../../lib/repositories/photo-categories", () => ({
  listPhotoCategories: listPhotoCategoriesMock,
  getPhotoCategoryBySlug: vi.fn(),
}));

vi.mock("../../lib/repositories/photos", () => ({
  listPublishedPhotos: listPublishedPhotosMock,
}));

import { getPublicPhotoAlbums } from "../../lib/public-photos";

function createPrismaConnectionError() {
  const error = new Error("Can't reach database server");
  error.code = "P1001";
  return error;
}

describe("public photos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retries public album loading after a transient Prisma connection error", async () => {
    listPhotoCategoriesMock
      .mockRejectedValueOnce(createPrismaConnectionError())
      .mockResolvedValueOnce([
        {
          id: "album-1",
          name: "Random",
          slug: "random",
          description: "",
          sortOrder: 0,
        },
      ]);
    listPublishedPhotosMock.mockResolvedValue([
      {
        id: "photo-1",
        title: "Cover",
        caption: "",
        imageUrl: "/images/gallery/cover.jpg",
        categoryId: "album-1",
        sortOrder: 0,
      },
    ]);

    const albums = await getPublicPhotoAlbums();

    expect(albums).toHaveLength(1);
    expect(albums[0]).toMatchObject({
      slug: "random",
      coverImageUrl: "/images/gallery/cover.jpg",
      photoCount: 1,
    });
    expect(listPhotoCategoriesMock).toHaveBeenCalledTimes(2);
    expect(listPublishedPhotosMock).toHaveBeenCalledTimes(2);
  });
});
