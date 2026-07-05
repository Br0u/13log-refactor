import React from "react";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../../lib/public-photos", () => ({
  getPublicPhotoAlbums: vi.fn(async () => [
    {
      id: "album-1",
      name: "Car",
      slug: "car",
      albumAnnotation: "注释词 A",
      description: "",
      photoCount: 3,
      coverImageUrl: "/images/gallery/car-cover.jpg",
      coverTitle: "Morning platform",
    },
    {
      id: "album-2",
      name: "Random",
      slug: "random",
      albumAnnotation: null,
      description: "",
      photoCount: 8,
      coverImageUrl: "/images/gallery/random-cover.jpg",
      coverTitle: "Night corner",
    },
    {
      id: "album-3",
      name: "April",
      slug: "april",
      albumAnnotation: "注释词 C",
      description: "",
      photoCount: 6,
      coverImageUrl: "/images/gallery/april-cover.jpg",
      coverTitle: "Light air",
    },
    {
      id: "album-4",
      name: "Again",
      slug: "again",
      albumAnnotation: "注释词 D",
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
    expect(markup).toContain("<h1>Photos</h1>");
    expect(markup).toContain("杂乱无章的册子");
    expect(markup).toContain("photo-mobile-intro");
    expect(markup).toContain("用镜头记录一些无意义的瞬间。");
    expect(markup).not.toContain("photo-filter");
    expect(markup).not.toContain("photo-category-chip");
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
    expect(markup).toContain("photo-album-card__annotation");
    expect(markup).toContain("注释词 A");
    expect(markup).toContain("注释词 C");
    expect(markup).toContain("注释词 D");
    expect(markup).toContain("photo-page-note");
    expect(markup).toContain("大多是零散散落在朋友圈里的影像，懒于归档，索性一并收拢于此。");
    expect(markup).toContain("拍摄设备：手机与相机。");
    expect(markup).not.toContain("blog-rail__section--intro");
    expect(markup).not.toContain("flip-gallery");
    expect(markup).not.toContain(">null<");
  });

  it("uses the dedicated ink landscape background for photos surfaces", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toContain("body:has(.blog-layout--photos-index)");
    expect(stylesheet).toContain("body:has(.blog-layout--photo-album)");
    expect(stylesheet).toContain('image-set(url("/images/backgrounds/photos-ink-bg.webp") type("image/webp"), url("/images/backgrounds/photos-ink-bg.png") type("image/png")) center / cover no-repeat fixed');
    expect(stylesheet).toContain("body.dark:has(.blog-layout--photos-index)");
    expect(stylesheet).toContain('image-set(url("/images/backgrounds/photos-night-ink-bg.webp") type("image/webp"), url("/images/backgrounds/photos-night-ink-bg.png") type("image/png")) center / cover no-repeat fixed');
  });

  it("gives the photos index a blue glass treatment in dark mode", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--photos-index\),\s*body\.dark:has\(\.blog-layout--photo-album\)\s*\{[^}]*--primary:\s*#dbeaff;[^}]*photos-night-ink-bg\.png/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--photos-index\)\s+\.blog-rail,\s*body\.dark:has\(\.blog-layout--photo-album\)\s+\.blog-rail\s*\{[^}]*border-color:\s*rgba\(105,\s*157,\s*226,\s*0\.34\);[^}]*background:[^}]*rgba\(5,\s*12,\s*22,\s*0\.34\);[^}]*box-shadow:[^}]*rgba\(0,\s*0,\s*0,\s*0\.62\)/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--photos-index\)\s+\.photo-album-card::after\s*\{[^}]*border-bottom-color:\s*rgba\(105,\s*157,\s*226,\s*0\.28\);/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--photos-index\)\s+\.photo-album-card__cover\s*\{[^}]*border-color:\s*rgba\(105,\s*157,\s*226,\s*0\.34\);[^}]*background:[^}]*rgba\(4,\s*12,\s*24,\s*0\.62\);[^}]*box-shadow:[^}]*rgba\(0,\s*0,\s*0,\s*0\.58\)/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--photos-index\)\s+\.photo-album-card__cover\s+img\s*\{[^}]*filter:\s*brightness\(0\.68\)\s+saturate\(0\.74\)\s+contrast\(1\.08\);/s);
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body\.dark:has\(\.blog-layout--photos-index\),\s*body\.dark:has\(\.blog-layout--photo-album\)\s*\{[^}]*photos-mobile-night-ink-bg\.png[^}]*no-repeat,/s);
  });

  it("uses a dedicated mobile night photos layout without adding filter chips or album meta", () => {
    const stylesheet = fs.readFileSync(path.join(process.cwd(), "app/papermod-custom.css"), "utf8");

    expect(stylesheet).toContain('image-set(url("/images/backgrounds/photos-mobile-night-ink-bg.webp") type("image/webp"), url("/images/backgrounds/photos-mobile-night-ink-bg.png") type("image/png")) center top / cover no-repeat');
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--photos-index\)\s+#menu\s*\{[^}]*position:\s*fixed;[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\);/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--photos-index\)\s+#menu\s+\.site-nav-icon\s*\{[^}]*display:\s*block;/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--photos-index\)\s+\.photo-mobile-intro\s*\{[^}]*display:\s*block;/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--photos-index\)\s+\.page-header\s+\.post-description\s*\{[^}]*color:\s*rgba\(224,\s*237,\s*255,\s*0\.92\);/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--photos-index\)\s+\.photo-mobile-intro\s*\{[^}]*color:\s*rgba\(224,\s*237,\s*255,\s*0\.94\);/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--photos-index\)\s+\.photo-album-card\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.1fr\)\s+minmax\(0,\s*0\.9fr\);/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--photos-index\)\s+\.photo-album-card__annotation\s*\{[^}]*display:\s*none;/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--photos-index\)\s+\.photo-album-card__description\s*\{[^}]*color:\s*rgba\(224,\s*237,\s*255,\s*0\.88\);/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--photos-index\)\s+\.photo-page-note\s*\{[^}]*display:\s*block;[^}]*border-left:\s*1px\s+solid\s+rgba\(126,\s*174,\s*238,\s*0\.18\);[^}]*color:\s*rgba\(224,\s*237,\s*255,\s*0\.88\);/s);
    expect(stylesheet).toMatch(/body\.dark:has\(\.blog-layout--photos-index\)\s+\.photo-page-note\s*\{[^}]*border-radius:\s*0;[^}]*box-shadow:\s*none;[^}]*backdrop-filter:\s*none;/s);
    expect(stylesheet).not.toContain(".photo-filter");
    expect(stylesheet).not.toContain(".photo-category-chip");
  });
});
