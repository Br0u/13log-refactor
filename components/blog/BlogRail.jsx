import React from "react";
import Link from "next/link";

const DEFAULT_NAV_ITEMS = [
  { href: "/posts/", label: "/ posts" },
  { href: "/about/", label: "/ about" },
  { href: "/link/", label: "/ Link" },
  { href: "/photos/index.html", label: "/ Photos" },
];

function RailLink({ item }) {
  if (item.external) {
    return (
      <a className="blog-rail__nav-link" href={item.href} target="_blank" rel="noopener noreferrer">
        {item.label}
      </a>
    );
  }

  return (
    <Link className="blog-rail__nav-link" href={item.href}>
      {item.label}
    </Link>
  );
}

export default function BlogRail({
  variant = "posts",
  introTitle = "",
  introBody = "",
  meta = "",
  tocHtml = "",
  relatedPosts = [],
}) {
  return (
    <aside className={`blog-rail blog-rail--${variant}`}>
      <nav className="blog-rail__nav" aria-label="博客导览">
        {DEFAULT_NAV_ITEMS.map((item) => <RailLink item={item} key={item.href} />)}
      </nav>

      {variant === "detail" ? (
        <>
          <section className="blog-rail__section blog-rail__section--context">
            <Link className="blog-rail__back-link" href="/posts">
              返回 Posts
            </Link>
            <h2 className="blog-rail__heading">{introTitle}</h2>
            {meta ? <p className="blog-rail__meta">{meta}</p> : null}
          </section>

          {tocHtml ? (
            <section className="blog-rail__section">
              <div className="blog-rail__section-title">文章目录</div>
              <div className="blog-rail__toc" dangerouslySetInnerHTML={{ __html: tocHtml }} />
            </section>
          ) : null}

          {relatedPosts.length ? (
            <section className="blog-rail__section">
              <div className="blog-rail__section-title">相关文章</div>
              <div className="blog-rail__related">
                {relatedPosts.map((item) => (
                  <Link className="blog-rail__related-link" href={`/posts/${encodeURIComponent(item.urlSlug || item.slug)}`} key={item.slug}>
                    {item.title}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <section className="blog-rail__section blog-rail__section--intro">
          {introTitle ? <h2 className="blog-rail__heading">{introTitle}</h2> : null}
          {introBody ? <p className="blog-rail__copy">{introBody}</p> : null}
        </section>
      )}
    </aside>
  );
}
