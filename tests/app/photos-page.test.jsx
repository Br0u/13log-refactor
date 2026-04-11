import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../../lib/public-photos", () => ({
  getPublicPhotoAlbums: vi.fn(async () => [
    {
      id: "album-1",
      name: "Car",
      slug: "car",
      description: "",
      photoCount: 3,
      coverImageUrl: "/images/gallery/car-cover.jpg",
      coverTitle: "Morning platform",
    },
    {
      id: "album-2",
      name: "Random",
      slug: "random",
      description: "",
      photoCount: 8,
      coverImageUrl: "/images/gallery/random-cover.jpg",
      coverTitle: "Night corner",
    },
    {
      id: "album-3",
      name: "April",
      slug: "april",
      description: "",
      photoCount: 6,
      coverImageUrl: "/images/gallery/april-cover.jpg",
      coverTitle: "Light air",
    },
    {
      id: "album-4",
      name: "Again",
      slug: "again",
      description: "",
      photoCount: 5,
      coverImageUrl: "/images/gallery/again-cover.jpg",
      coverTitle: "Again",
    },
  ]),
}));

import PhotosPage from "../../app/photos/page.jsx";

describe("photos index page", () => {
  it("renders a site-native album index instead of the legacy flip-book shell", async () => {
    const markup = renderToStaticMarkup(await PhotosPage());

    expect(markup).toContain("blog-layout blog-layout--photos-index");
    expect(markup).toContain("杂乱无章的册子");
    expect(markup).not.toContain("按相册进入");
    expect(markup).toContain("「世界は　ただ通り過ぎていく」");
    expect(markup).toContain("「日常才是最难被看见的东西。」");
    expect(markup).toContain("「四月的空氣」");
    expect(markup).toContain("「告诉你吧，世界");
    expect(markup).toContain("我—不—相—信！」");
    expect(markup).toContain("車窗之外，世界剛好經過。");
    expect(markup).toContain("光線變輕了。");
    expect(markup).not.toContain("3 张");
    expect(markup).toContain("<span>「告诉你吧，世界</span><span>我—不—相—信！」</span>");
    expect(markup).toContain('href="/photos/car"');
    expect(markup).toContain('src="/images/gallery/car-cover.jpg"');
    expect(markup).toContain("photo-album-card");
    expect(markup).toContain("photo-album-card__body");
    expect(markup).toContain("photo-album-card__cover");
    expect(markup).toContain("photo-page-note");
    expect(markup).toContain("大多是零散散落在朋友圈里的影像，懒于归档，索性一并收拢于此。");
    expect(markup).toContain("拍摄设备：手机与相机。");
    expect(markup).not.toContain("blog-rail__section--intro");
    expect(markup).not.toContain("flip-gallery");
  });
});
