import React from "react";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");
  return {
    ...actual,
    notFound: notFoundMock,
  };
});

vi.mock("../../lib/public-photos", () => ({
  getPublicPhotoAlbumBySlug: vi.fn(async (slug) => (
    slug === "car" || slug === "car park"
      ? {
          id: "album-1",
          name: "Car",
          slug,
          description: "A quiet album from the road.",
          photoCount: 2,
          coverImageUrl: "/images/gallery/travel-cover.jpg",
          coverTitle: "Morning platform",
          photos: [
            {
              id: "photo-1",
              title: "Morning platform",
              caption: "A little fog before departure.",
              imageUrl: "/images/gallery/travel-cover.jpg",
            },
            {
              id: "photo-2",
              title: "Station bench",
              caption: "",
              imageUrl: "/images/gallery/travel-bench.jpg",
            },
          ],
        }
      : null
  )),
}));

import PhotoAlbumPage from "../../app/photos/[slug]/page.jsx";

describe("photo album page", () => {
  it("renders a reading-style single-column photo stream", async () => {
    const markup = renderToStaticMarkup(await PhotoAlbumPage({
      params: Promise.resolve({ slug: "car" }),
    }));

    expect(markup).toContain("blog-layout blog-layout--photo-album");
    expect(markup).toContain("blog-rail blog-rail--detail");
    expect(markup).toContain("返回 Photos");
    expect(markup).toContain("世界は　ただ通り過ぎていく");
    expect(markup).toContain("車窗之外，世界剛好經過。");
    expect(markup).toContain("photo-album-stream");
    expect(markup).toContain("Morning platform");
    expect(markup).toContain("A little fog before departure.");
    expect(markup).toContain('src="/images/gallery/travel-bench.jpg"');
    expect(markup).not.toContain("flip-gallery");
  });

  it("delegates missing albums to notFound", async () => {
    await expect(PhotoAlbumPage({
      params: Promise.resolve({ slug: "missing" }),
    })).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalled();
  });

  it("decodes encoded album slugs before loading the public album", async () => {
    const markup = renderToStaticMarkup(await PhotoAlbumPage({
      params: Promise.resolve({ slug: "car%20park" }),
    }));

    const { getPublicPhotoAlbumBySlug } = await import("../../lib/public-photos");
    expect(getPublicPhotoAlbumBySlug).toHaveBeenCalledWith("car park");
    expect(markup).toContain("Morning platform");
  });

  it("uses the photos night treatment on album detail surfaces", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--photos-index\)\s+\.blog-rail,\s*body\.dark:has\(\.blog-layout--photo-album\)\s+\.blog-rail\s*\{[^}]*border-color:\s*rgba\(105,\s*157,\s*226,\s*0\.34\);[^}]*background:[^}]*rgba\(5,\s*12,\s*22,\s*0\.34\);/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--photo-album\)\s+\.photo-album-image\s*\{[^}]*border-color:\s*rgba\(105,\s*157,\s*226,\s*0\.34\);[^}]*background:[^}]*rgba\(4,\s*12,\s*24,\s*0\.62\);[^}]*box-shadow:[^}]*rgba\(0,\s*0,\s*0,\s*0\.58\)[^}]*filter:\s*brightness\(0\.74\)\s+saturate\(0\.78\)\s+contrast\(1\.08\);/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--photo-album\)\s+\.photo-album-page__description\s*\{[^}]*border-left-color:\s*rgba\(105,\s*157,\s*226,\s*0\.42\);[^}]*color:\s*rgba\(213,\s*229,\s*255,\s*0\.82\);/s);
  });
});
