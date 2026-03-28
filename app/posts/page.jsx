import React from "react";
import Link from "next/link";
import { collectFilterCounts } from "../../lib/content";
import PostsTimeline from "../../components/blog/PostsTimeline";
import BlogRail from "../../components/blog/BlogRail";
import { getPublicTimelineEntries } from "../../lib/public-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Posts | 我的小小世界",
};

function renderHeader(tags, activeTag) {
  if (tags.length === 0) return null;
  return (
    <div className="posts-filter">
      <Link
        className={`posts-filter__chip${!activeTag ? " is-active" : ""}`}
        href="/posts"
        aria-current={!activeTag ? "page" : undefined}
      >
        /全部
      </Link>
      {tags.map((item) => (
        <Link
          key={item.tag}
          className={`posts-filter__chip${activeTag === item.tag ? " is-active" : ""}`}
          href={`/posts?tag=${encodeURIComponent(item.tag)}`}
          aria-current={activeTag === item.tag ? "page" : undefined}
        >
          /{item.tag}
        </Link>
      ))}
    </div>
  );
}

export default async function PostsPage({ searchParams }) {
  const sp = await searchParams;
  const activeTag = typeof sp?.tag === "string" && sp.tag.trim() ? sp.tag.trim() : null;
  const [allEntries, filteredEntries] = activeTag
    ? await Promise.all([
      getPublicTimelineEntries({ renderMicroHtml: false }),
      getPublicTimelineEntries({ tag: activeTag }),
    ])
    : [await getPublicTimelineEntries(), null];
  const tags = collectFilterCounts(allEntries);
  const posts = activeTag
    ? filteredEntries
    : allEntries;

  return (
    <div className="blog-layout blog-layout--posts-index">
      <BlogRail
        variant="posts"
        introTitle="前言"
        introBody="写下来的东西会慢一点，先经过自己，再流向别人。这里保留分类和标签，但更希望它们像一条连续的阅读线。"
      />
      <section className="blog-layout__main">
        <header className="page-header">
          <h1>Posts</h1>
          {renderHeader(tags, activeTag)}
        </header>

        <PostsTimeline entries={posts} layout="posts-list" initialVisibleCount={6} />
      </section>
    </div>
  );
}
