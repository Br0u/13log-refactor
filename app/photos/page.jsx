import React from "react";
import Link from "next/link";
import BlogRail from "../../components/blog/BlogRail";
import { getPhotoAlbumCopy } from "../../lib/photo-album-copy";
import { getPublicPhotoAlbums } from "../../lib/public-photos";

export const metadata = {
  title: "杂乱无章的册子 | 我的小小世界",
};

function resolveIndexCopy(album) {
  const fallback = getPhotoAlbumCopy(
    album.slug,
    album.name,
    album.description || "进入这一册照片，沿着留白慢慢往下看。"
  );

  return {
    displayName: album.displayTitle || fallback.displayName,
    coverTitleLines: album.coverTitleLines?.length ? album.coverTitleLines : fallback.coverTitleLines,
    indexDescriptionLines: album.indexDescriptionLines?.length ? album.indexDescriptionLines : fallback.body,
    usesFallbackTitle: !album.coverTitleLines?.length,
  };
}

export default async function PhotosPage() {
  const albums = await getPublicPhotoAlbums();

  return (
    <div className="blog-layout blog-layout--photos-index">
      <BlogRail variant="photos" />
      <section className="blog-layout__main">
        <header className="page-header page-header--photos">
          <h1>杂乱无章的册子</h1>
        </header>

        <div className="photo-album-grid">
          {albums.map((album) => (
            <article className="photo-album-card" key={album.id}>
              {(() => {
                const copy = resolveIndexCopy(album);

                return (
                  <>
              <div className="photo-album-card__body">
                <h2 className="photo-album-card__title">
                  <Link href={`/photos/${encodeURIComponent(album.slug)}`}>
                    {copy.coverTitleLines.map((line, index) => (
                      <span key={line}>
                        {copy.usesFallbackTitle && index === 0 ? "「" : ""}
                        {line}
                        {copy.usesFallbackTitle && index === copy.coverTitleLines.length - 1 ? "」" : ""}
                      </span>
                    ))}
                  </Link>
                </h2>
                <p className="photo-album-card__description">
                  {copy.indexDescriptionLines.map((line) => <span key={line}>{line}</span>)}
                </p>
              </div>
                    <Link className="photo-album-card__cover" href={`/photos/${encodeURIComponent(album.slug)}`}>
                      <img
                        src={album.coverImageUrl}
                        alt={album.fallbackCoverTitle || copy.displayName}
                        loading="lazy"
                        decoding="async"
                      />
                    </Link>
                  </>
                );
              })()}
            </article>
          ))}
        </div>

        <section className="photo-page-note" aria-label="关于这些照片">
          <p>
            大多是零散散落在朋友圈里的影像，懒于归档，索性一并收拢于此。
          </p>
          <p>
            我始终觉得，后期并非修饰，而是另一种创作
            会依着当下的情绪，对画面做些带有私心的改动。
          </p>
          <p>拍摄设备：手机与相机。</p>
        </section>
      </section>
    </div>
  );
}
