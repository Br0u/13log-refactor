import { describe, expect, it, vi } from "vitest";

const { listPublishedPhotosMock, listPhotoCategoriesMock } = vi.hoisted(() => ({
  listPublishedPhotosMock: vi.fn(async () => ([
    {
      id: "photo-1",
      title: "Morning Light",
      imageUrl: "https://cdn.example.com/morning-light.jpg",
      category: {
        id: "cat-1",
        name: "Travel",
        slug: "travel",
      },
      publishedAt: new Date("2026-03-18T10:00:00.000Z"),
    },
  ])),
  listPhotoCategoriesMock: vi.fn(async (filters) => (
    filters?.status === "PUBLISHED"
      ? [
          {
            id: "cat-1",
            name: "Travel",
            slug: "travel",
            status: "PUBLISHED",
            sortOrder: 2,
          },
        ]
      : [
          {
            id: "cat-1",
            name: "Travel",
            slug: "travel",
            status: "PUBLISHED",
            sortOrder: 2,
          },
          {
            id: "cat-2",
            name: "Private",
            slug: "private",
            status: "DRAFT",
            sortOrder: 3,
          },
        ]
  )),
}));

vi.mock("../../../lib/repositories/photos", () => ({
  listPublishedPhotos: listPublishedPhotosMock,
}));

vi.mock("../../../lib/repositories/photo-categories", () => ({
  listPhotoCategories: listPhotoCategoriesMock,
}));

import { GET as photosRoute } from "../../../app/api/photos/route";

describe("public photos api", () => {
  it("returns published categories first so the flip-book page can load albums on demand", async () => {
    const response = await photosRoute(new Request("http://localhost:3000/api/photos"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      categories: [
        { id: "cat-1", name: "Travel", slug: "travel", sortOrder: 2 },
      ],
      photos: [],
    });
    expect(listPhotoCategoriesMock).toHaveBeenCalledWith({ status: "PUBLISHED" });
    expect(listPublishedPhotosMock).not.toHaveBeenCalled();
  });

  it("returns only the requested album photos when a batch slug is provided", async () => {
    const response = await photosRoute(new Request("http://localhost:3000/api/photos?album=travel"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.photos).toEqual([
      {
        id: "photo-1",
        title: "Morning Light",
        imageUrl: "https://cdn.example.com/morning-light.jpg",
        category: {
          id: "cat-1",
          name: "Travel",
          slug: "travel",
        },
        publishedAt: "2026-03-18T10:00:00.000Z",
      },
    ]);
    expect(listPublishedPhotosMock).toHaveBeenCalledWith({ categorySlug: "travel" });
  });
});
