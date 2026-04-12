import React from "react";
import { notFound } from "next/navigation";
import BlogRail from "../../../components/blog/BlogRail";
import { getPhotoAlbumCopy } from "../../../lib/photo-album-copy";
import { getPublicPhotoAlbumBySlug } from "../../../lib/public-photos";

function resolveAlbumCopy(album) {
  const fallback = getPhotoAlbumCopy(album.slug, album.name, album.description);

  return {
    displayName: album.displayTitle || fallback.displayName,
    detailDescriptionLines: album.detailDescriptionLines?.length ? album.detailDescriptionLines : fallback.body,
  };
}

function decodeAlbumSlug(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch {
    return String(value || "");
  }
}

export async function generateMetadata({ params }) {
  const { slug: rawSlug } = await params;
  const slug = decodeAlbumSlug(rawSlug);
  const album = await getPublicPhotoAlbumBySlug(slug);

  if (!album) {
    return {
      title: "Photos | 我的小小世界",
    };
  }

  const copy = resolveAlbumCopy(album);

  return {
    title: `${copy.displayName} | Photos | 我的小小世界`,
  };
}

export default async function PhotoAlbumPage({ params }) {
  const { slug: rawSlug } = await params;
  const slug = decodeAlbumSlug(rawSlug);
  const album = await getPublicPhotoAlbumBySlug(slug);

  if (!album) {
    notFound();
  }

  const copy = resolveAlbumCopy(album);

  return (
    <div className="blog-layout blog-layout--photo-album">
      <BlogRail
        variant="detail"
        introTitle={copy.displayName}
        meta={`${album.photoCount} 张照片`}
        backHref="/photos"
        backLabel="返回 Photos"
      />
      <section className="blog-layout__main">
        <header className="page-header">
          <h1>{copy.displayName}</h1>
          {copy.detailDescriptionLines.length ? (
            <p className="post-description photo-album-page__description">
              {copy.detailDescriptionLines.map((line) => <span key={line}>{line}</span>)}
            </p>
          ) : null}
        </header>

        <div className="photo-album-stream">
          {album.photos.map((photo, index) => (
            <figure className="photo-album-frame" key={photo.id}>
              <img
                className="photo-album-image"
                src={photo.imageUrl}
                alt={photo.title || `${album.name} ${index + 1}`}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
              />
              {photo.title || photo.caption ? (
                <figcaption className="photo-album-caption">
                  {photo.title ? <strong className="photo-album-caption__title">{photo.title}</strong> : null}
                  {photo.caption ? <span className="photo-album-caption__body">{photo.caption}</span> : null}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
