import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getPhotoCategoryBySlugMock,
  listPhotoCategoriesMock,
  listPublishedPhotosMock,
} = vi.hoisted(() => ({
  getPhotoCategoryBySlugMock: vi.fn(),
  listPhotoCategoriesMock: vi.fn(),
  listPublishedPhotosMock: vi.fn(),
}));

vi.mock("../../lib/repositories/photo-categories", () => ({
  listPhotoCategories: listPhotoCategoriesMock,
  getPhotoCategoryBySlug: getPhotoCategoryBySlugMock,
}));

vi.mock("../../lib/repositories/photos", () => ({
  listPublishedPhotos: listPublishedPhotosMock,
}));

import {
  getPublicPhotoAlbumBySlug,
  getPublicPhotoAlbums,
} from "../../lib/public-photos";

function createPrismaConnectionError(code = "P1001", message = "Can't reach database server") {
  const error = new Error(message);
  error.code = code;
  return error;
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

describe("public photos", () => {
  beforeEach(() => {
    getPhotoCategoryBySlugMock.mockReset();
    listPhotoCategoriesMock.mockReset();
    listPublishedPhotosMock.mockReset();
    listPhotoCategoriesMock.mockResolvedValue([]);
    listPublishedPhotosMock.mockResolvedValue([]);
    getPhotoCategoryBySlugMock.mockResolvedValue(null);
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

  it("returns pinned legacy index albums after the single retry also fails", async () => {
    listPhotoCategoriesMock.mockRejectedValue(createPrismaConnectionError());

    const albums = await getPublicPhotoAlbums();

    expect(albums.map((album) => album.slug)).toEqual(["random", "april", "again"]);
    expect(albums[0]).toEqual({
      id: "legacy-album-random",
      name: "Random",
      slug: "random",
      description: "",
      albumAnnotation: "",
      displayTitle: "",
      coverTitle: "",
      coverTitleLines: [],
      indexDescription: "",
      indexDescriptionLines: [],
      detailDescription: "",
      detailDescriptionLines: [],
      photoCount: 22,
      coverImageUrl: "/images/gallery/05051dcb0t816a84ff98745e8c52828a.jpg",
      fallbackCoverTitle: "摄影作品 01",
    });
    expect(albums[0].photos).toBeUndefined();
    expect(listPhotoCategoriesMock).toHaveBeenCalledTimes(2);
    expect(listPublishedPhotosMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["P1001", "Can't reach database server"],
    ["P1017", "Server has closed the connection"],
    [null, "TLS connection was non-properly terminated"],
    [null, "connection closed unexpectedly"],
  ])("recognizes %s / %s as a transient index outage", async (code, message) => {
    listPhotoCategoriesMock.mockRejectedValue(createPrismaConnectionError(code, message));

    await expect(getPublicPhotoAlbums()).resolves.toHaveLength(3);
    expect(listPhotoCategoriesMock).toHaveBeenCalledTimes(2);
  });

  it("throws an initial non-transient index error without retrying or falling back", async () => {
    const error = new Error("invalid query");
    listPhotoCategoriesMock.mockRejectedValue(error);

    await expect(getPublicPhotoAlbums()).rejects.toBe(error);
    expect(listPhotoCategoriesMock).toHaveBeenCalledTimes(1);
    expect(listPublishedPhotosMock).toHaveBeenCalledTimes(1);
  });

  it("throws the second non-transient index error after one transient failure", async () => {
    const secondError = new Error("invalid query");
    listPhotoCategoriesMock
      .mockRejectedValueOnce(createPrismaConnectionError())
      .mockRejectedValueOnce(secondError);

    await expect(getPublicPhotoAlbums()).rejects.toBe(secondError);
    expect(listPhotoCategoriesMock).toHaveBeenCalledTimes(2);
  });

  it("waits for a slower first-attempt index read and prioritizes its non-transient error", async () => {
    const delayedPhotos = createDeferred();
    const nonTransientError = new Error("invalid photo query");
    listPhotoCategoriesMock
      .mockRejectedValueOnce(createPrismaConnectionError())
      .mockResolvedValueOnce([]);
    listPublishedPhotosMock
      .mockReturnValueOnce(delayedPhotos.promise)
      .mockResolvedValueOnce([]);

    const result = getPublicPhotoAlbums();
    await Promise.resolve();
    await Promise.resolve();

    expect(listPhotoCategoriesMock).toHaveBeenCalledTimes(1);
    expect(listPublishedPhotosMock).toHaveBeenCalledTimes(1);

    delayedPhotos.reject(nonTransientError);

    await expect(result).rejects.toBe(nonTransientError);
    expect(listPhotoCategoriesMock).toHaveBeenCalledTimes(1);
    expect(listPublishedPhotosMock).toHaveBeenCalledTimes(1);
  });

  it("does not start the index retry until both first-attempt reads settle", async () => {
    const delayedPhotos = createDeferred();
    listPhotoCategoriesMock
      .mockRejectedValueOnce(createPrismaConnectionError())
      .mockResolvedValueOnce([]);
    listPublishedPhotosMock
      .mockReturnValueOnce(delayedPhotos.promise)
      .mockResolvedValueOnce([]);

    const result = getPublicPhotoAlbums();
    await Promise.resolve();
    await Promise.resolve();

    expect(listPhotoCategoriesMock).toHaveBeenCalledTimes(1);
    expect(listPublishedPhotosMock).toHaveBeenCalledTimes(1);

    delayedPhotos.resolve([]);

    await expect(result).resolves.toEqual([]);
    expect(listPhotoCategoriesMock).toHaveBeenCalledTimes(2);
    expect(listPublishedPhotosMock).toHaveBeenCalledTimes(2);
  });

  it("throws a non-transient index error from the retry even when its sibling is transient", async () => {
    const secondError = new Error("invalid photo query on retry");
    listPhotoCategoriesMock
      .mockRejectedValueOnce(createPrismaConnectionError("P1001"))
      .mockRejectedValueOnce(createPrismaConnectionError("P1017"));
    listPublishedPhotosMock
      .mockRejectedValueOnce(createPrismaConnectionError("P1017"))
      .mockRejectedValueOnce(secondError);

    await expect(getPublicPhotoAlbums()).rejects.toBe(secondError);
    expect(listPhotoCategoriesMock).toHaveBeenCalledTimes(2);
    expect(listPublishedPhotosMock).toHaveBeenCalledTimes(2);
  });

  it("does not hide index mapper errors behind the outage fallback", async () => {
    const mapperError = new Error("broken image mapper");
    const photo = {
      id: "photo-1",
      title: "Cover",
      categoryId: "album-1",
      sortOrder: 0,
    };
    Object.defineProperty(photo, "imageUrl", {
      get() {
        throw mapperError;
      },
    });
    listPhotoCategoriesMock.mockResolvedValue([
      { id: "album-1", name: "Random", slug: "random", status: "PUBLISHED" },
    ]);
    listPublishedPhotosMock.mockResolvedValue([photo]);

    await expect(getPublicPhotoAlbums()).rejects.toBe(mapperError);
    expect(listPhotoCategoriesMock).toHaveBeenCalledTimes(1);
  });

  it("returns a pinned legacy detail album after the single retry also fails", async () => {
    getPhotoCategoryBySlugMock.mockRejectedValue(createPrismaConnectionError("P1017"));

    const album = await getPublicPhotoAlbumBySlug("random");

    expect(album).toMatchObject({
      id: "legacy-album-random",
      name: "Random",
      slug: "random",
      description: "",
      albumAnnotation: "",
      displayTitle: "",
      coverTitle: "",
      coverTitleLines: [],
      indexDescription: "",
      indexDescriptionLines: [],
      detailDescription: "",
      detailDescriptionLines: [],
      photoCount: 22,
      coverImageUrl: "/images/gallery/05051dcb0t816a84ff98745e8c52828a.jpg",
      fallbackCoverTitle: "摄影作品 01",
    });
    expect(album.photos[0]).toEqual({
      id: "legacy-photo-random-1",
      title: "摄影作品 01",
      caption: "",
      imageUrl: "/images/gallery/05051dcb0t816a84ff98745e8c52828a.jpg",
      sortOrder: 0,
    });
    expect(album.photos.at(-1)).toMatchObject({
      id: "legacy-photo-random-22",
      sortOrder: 21,
    });
    expect(getPhotoCategoryBySlugMock).toHaveBeenCalledTimes(2);
    expect(listPublishedPhotosMock).not.toHaveBeenCalled();
  });

  it("returns null for an unknown legacy slug while offline", async () => {
    getPhotoCategoryBySlugMock.mockRejectedValue(
      createPrismaConnectionError(null, "connection closed"),
    );

    await expect(getPublicPhotoAlbumBySlug("missing")).resolves.toBeNull();
    expect(getPhotoCategoryBySlugMock).toHaveBeenCalledTimes(2);
  });

  it("throws an initial non-transient detail error without retrying or falling back", async () => {
    const error = new Error("invalid query");
    getPhotoCategoryBySlugMock.mockRejectedValue(error);

    await expect(getPublicPhotoAlbumBySlug("random")).rejects.toBe(error);
    expect(getPhotoCategoryBySlugMock).toHaveBeenCalledTimes(1);
  });

  it("throws the second non-transient detail error after one transient failure", async () => {
    const secondError = new Error("invalid query");
    getPhotoCategoryBySlugMock
      .mockRejectedValueOnce(createPrismaConnectionError())
      .mockRejectedValueOnce(secondError);

    await expect(getPublicPhotoAlbumBySlug("random")).rejects.toBe(secondError);
    expect(getPhotoCategoryBySlugMock).toHaveBeenCalledTimes(2);
  });

  it("uses legacy detail data only after exactly two transient failures", async () => {
    getPhotoCategoryBySlugMock
      .mockRejectedValueOnce(createPrismaConnectionError("P1001"))
      .mockRejectedValueOnce(createPrismaConnectionError("P1017"));

    await expect(getPublicPhotoAlbumBySlug("april")).resolves.toMatchObject({
      id: "legacy-album-april",
      slug: "april",
      photoCount: 17,
    });
    expect(getPhotoCategoryBySlugMock).toHaveBeenCalledTimes(2);
  });

  it("does not hide detail mapper errors behind the outage fallback", async () => {
    const mapperError = new Error("broken detail mapper");
    const photo = {
      id: "photo-1",
      title: "Cover",
      categoryId: "album-1",
      sortOrder: 0,
    };
    Object.defineProperty(photo, "imageUrl", {
      get() {
        throw mapperError;
      },
    });
    getPhotoCategoryBySlugMock.mockResolvedValue({
      id: "album-1",
      name: "Random",
      slug: "random",
      status: "PUBLISHED",
    });
    listPublishedPhotosMock.mockResolvedValue([photo]);

    await expect(getPublicPhotoAlbumBySlug("random")).rejects.toBe(mapperError);
    expect(getPhotoCategoryBySlugMock).toHaveBeenCalledTimes(1);
    expect(listPublishedPhotosMock).toHaveBeenCalledTimes(1);
  });
});
