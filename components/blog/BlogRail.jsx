import React from "react";
import Link from "next/link";

const DEFAULT_NAV_ITEMS = [
  { href: "/posts/", label: "/ POSTS", section: "posts" },
  { href: "/about/", label: "/ ABOUT", section: "about" },
  { href: "/link/", label: "/ LINK", section: "link" },
  { href: "/playzone/", label: "/ PLAYZONE", section: "playzone" },
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
          <svg className="blog-rail__brand-logo" width="240" height="240" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <filter id="blog-rail-logo-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
              </filter>
            </defs>
            <circle cx="120" cy="120" r="108" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="120" cy="120" r="92" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.9" />
            <circle cx="120" cy="120" r="78" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.8" />
            <g fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="120" y1="18" x2="120" y2="28" />
              <line x1="120" y1="212" x2="120" y2="222" />
              <line x1="18" y1="120" x2="28" y2="120" />
              <line x1="212" y1="120" x2="222" y2="120" />
              <path d="M40 150 C70 120, 95 118, 120 132 C145 145, 165 120, 200 110" />
              <path d="M85 140 L105 160 L130 140" />
              <path d="M120 145 L140 160 L160 145" />
              <path d="M118 150 C110 165, 125 175, 115 190 C108 205, 130 205, 125 190 C120 175, 135 165, 125 150" />
              <path d="M70 155 L65 165 L75 165 Z" />
              <path d="M70 148 L64 158 L76 158 Z" />
              <line x1="70" y1="165" x2="70" y2="173" />
              <path d="M90 160 L85 170 L95 170 Z" />
              <path d="M90 153 L84 163 L96 163 Z" />
              <line x1="90" y1="170" x2="90" y2="178" />
              <path d="M165 158 L160 168 L170 168 Z" />
              <path d="M165 151 L159 161 L171 161 Z" />
              <line x1="165" y1="168" x2="165" y2="176" />
            </g>
            <circle cx="155" cy="78" r="5.5" fill="currentColor" opacity="0.9" />
            <path d="M35 160 L75 120 L110 160 L140 130 L175 160" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.9" />
            <path d="M50 170 L90 125 L125 170 L150 140 L185 170 Z" fill="currentColor" opacity="0.55" filter="url(#blog-rail-logo-shadow)" />
            <path d="M60 180 C95 175, 145 175, 180 180" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.9" />
          </svg>
          <span className="blog-rail__brand-text">
            <span className="blog-rail__brand-kicker">/ MY LITTLE WORLD /</span>
            <span className="blog-rail__brand-mark">13log</span>
          </span>
        </Link>
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
