import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";

import { LEGACY_PHOTO_ALBUMS } from "../../lib/legacy-photo-data";
import { importLegacyPhotos } from "../../lib/legacy-photo-import";

describe("legacy photo import", () => {
  let createPhotoCategory;
  let createPhoto;
  let listPhotoCategories;
  let listAdminPhotos;
  let updatePhotoCategory;

  beforeEach(() => {
    createPhotoCategory = vi.fn();
    createPhoto = vi.fn();
    listPhotoCategories = vi.fn();
    listAdminPhotos = vi.fn();
    updatePhotoCategory = vi.fn();
  });

  it("keeps static album data independent from Prisma repositories", () => {
    const source = fs.readFileSync(
      new URL("../../lib/legacy-photo-data.js", import.meta.url),
      "utf8",
    );

    expect(source).not.toMatch(/repositories|prisma/i);
    expect(LEGACY_PHOTO_ALBUMS.map((album) => album.slug)).toEqual([
      "random",
      "april",
      "again",
    ]);
  });

  it("creates the legacy albums in the original order and imports their photos", async () => {
    listPhotoCategories.mockResolvedValue([]);
    listAdminPhotos.mockResolvedValue([]);
    createPhotoCategory
      .mockResolvedValueOnce({ id: "cat-random", name: "Random", slug: "random", sortOrder: 0 })
      .mockResolvedValueOnce({ id: "cat-april", name: "April", slug: "april", sortOrder: 1 })
      .mockResolvedValueOnce({ id: "cat-again", name: "Again", slug: "again", sortOrder: 2 });

    const summary = await importLegacyPhotos({
      createPhotoCategory,
      createPhoto,
      listAdminPhotos,
      listPhotoCategories,
      updatePhotoCategory,
    });

    expect(createPhotoCategory).toHaveBeenNthCalledWith(1, expect.objectContaining({
      name: "Random",
      slug: "random",
      sortOrder: 0,
    }));
    expect(createPhotoCategory).toHaveBeenNthCalledWith(2, expect.objectContaining({
      name: "April",
      slug: "april",
      sortOrder: 1,
    }));
    expect(createPhotoCategory).toHaveBeenNthCalledWith(3, expect.objectContaining({
      name: "Again",
      slug: "again",
      sortOrder: 2,
    }));
    expect(createPhoto).toHaveBeenCalledTimes(
      LEGACY_PHOTO_ALBUMS.reduce((sum, album) => sum + album.photos.length, 0),
    );
    expect(createPhoto).toHaveBeenCalledWith(expect.objectContaining({
      title: "摄影作品 01",
      imageUrl: "/images/gallery/05051dcb0t816a84ff98745e8c52828a.jpg",
      pathname: "/images/gallery/05051dcb0t816a84ff98745e8c52828a.jpg",
      status: "PUBLISHED",
      sortOrder: 0,
      categoryId: "cat-random",
    }));
    expect(summary).toEqual({
      createdAlbums: 3,
      importedPhotos: 51,
      skippedPhotos: 0,
    });
  });

  it("skips photos whose pathname already exists so the import can be rerun safely", async () => {
    listPhotoCategories.mockResolvedValue([
      { id: "cat-random", name: "Random", slug: "random", sortOrder: 0 },
      { id: "cat-april", name: "April", slug: "april", sortOrder: 1 },
      { id: "cat-again", name: "Again", slug: "again", sortOrder: 2 },
    ]);
    listAdminPhotos.mockResolvedValue([
      { pathname: "/images/gallery/05051dcb0t816a84ff98745e8c52828a.jpg" },
      { pathname: "/images/gallery/gal01/R0001375.jpg" },
      { pathname: "/images/gallery/gal02/132218.JPG" },
    ]);

    const summary = await importLegacyPhotos({
      createPhotoCategory,
      createPhoto,
      listAdminPhotos,
      listPhotoCategories,
      updatePhotoCategory,
    });

    expect(createPhotoCategory).not.toHaveBeenCalled();
    expect(createPhoto).not.toHaveBeenCalledWith(expect.objectContaining({
      pathname: "/images/gallery/05051dcb0t816a84ff98745e8c52828a.jpg",
    }));
    expect(createPhoto).not.toHaveBeenCalledWith(expect.objectContaining({
      pathname: "/images/gallery/gal01/R0001375.jpg",
    }));
    expect(createPhoto).not.toHaveBeenCalledWith(expect.objectContaining({
      pathname: "/images/gallery/gal02/132218.JPG",
    }));
    expect(summary).toEqual({
      createdAlbums: 0,
      importedPhotos: 48,
      skippedPhotos: 3,
    });
  });

  it("reuses matching album names and normalizes their slug and order before importing", async () => {
    listPhotoCategories.mockResolvedValue([
      { id: "cat-april", name: "April", slug: "April", sortOrder: 0 },
      { id: "cat-random", name: "Random", slug: "random", sortOrder: 0 },
    ]);
    listAdminPhotos.mockResolvedValue([]);
    updatePhotoCategory.mockResolvedValueOnce({
      id: "cat-april",
      name: "April",
      slug: "april",
      sortOrder: 1,
    });
    createPhotoCategory.mockResolvedValueOnce({
      id: "cat-again",
      name: "Again",
      slug: "again",
      sortOrder: 2,
    });

    const summary = await importLegacyPhotos({
      createPhotoCategory,
      createPhoto,
      listAdminPhotos,
      listPhotoCategories,
      updatePhotoCategory,
    });

    expect(updatePhotoCategory).toHaveBeenCalledTimes(1);
    expect(updatePhotoCategory).toHaveBeenCalledWith("cat-april", {
      name: "April",
      slug: "april",
      sortOrder: 1,
    });
    expect(createPhotoCategory).toHaveBeenCalledWith(expect.objectContaining({
      name: "Again",
      slug: "again",
      sortOrder: 2,
    }));
    expect(summary).toEqual({
      createdAlbums: 1,
      importedPhotos: 51,
      skippedPhotos: 0,
    });
  });
});
