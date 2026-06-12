import React from "react";
import Link from "next/link";

const DEFAULT_NAV_ITEMS = [
  { href: "/posts/", label: "/ POSTS", section: "posts" },
  { href: "/about/", label: "/ ABOUT", section: "about" },
  { href: "/link/", label: "/ LINK", section: "link" },
  { href: "/photos/", label: "/ PHOTOS", section: "photos" },
];

function resolveActiveSection(variant) {
  if (variant === "detail") return "posts";
  return variant;
}

function RailLink({ activeSection, item }) {
  const isActive = item.section === activeSection;
  const className = `blog-rail__nav-link${isActive ? " is-active" : ""}`;

  if (item.external) {
    return (
      <a
        className={className}
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-current={isActive ? "page" : undefined}
      >
        {item.label}
      </a>
    );
  }

  return (
    <Link className={className} href={item.href} aria-current={isActive ? "page" : undefined}>
      {item.label}
    </Link>
  );
}

export default function BlogRail({
  variant = "posts",
  introTitle = "",
  introBody = "",
  hideIntroCard = false,
  meta = "",
  tocHtml = "",
  relatedPosts = [],
  backHref = "/posts",
  backLabel = "返回 Posts",
}) {
  const activeSection = resolveActiveSection(variant);

  return (
    <aside className={`blog-rail blog-rail--${variant}`}>
      <div className="blog-rail__brand">
        <Link className="blog-rail__brand-home" href="/" aria-label="13log home">
          <span className="blog-rail__brand-mark">13log</span>
        </Link>
        <p className="blog-rail__brand-kicker">/ MY LITTLE WORLD /</p>
      </div>

      <nav className="blog-rail__nav" aria-label="博客导览">
        {DEFAULT_NAV_ITEMS.map((item) => <RailLink activeSection={activeSection} item={item} key={item.href} />)}
      </nav>

      {variant === "detail" ? (
        <>
          <section className="blog-rail__section blog-rail__section--context">
            <Link className="blog-rail__back-link" href={backHref}>
              {backLabel}
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
      ) : !hideIntroCard && (introTitle || introBody) ? (
        <section className="blog-rail__section blog-rail__section--intro">
          <div className="blog-rail__intro-card">
            {introTitle ? <h2 className="blog-rail__heading">{introTitle}</h2> : null}
            {introBody ? (
              <p className="blog-rail__intro-text">
                <span>你，</span>
                <span>一会看我，</span>
                <span>一会看云。</span>
                <span>我觉得你看我时很远，</span>
                <span>你看云时很近。</span>
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
    </aside>
  );
}
