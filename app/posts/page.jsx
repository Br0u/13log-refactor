import React from "react";
import Link from "next/link";
import { collectEntryFilters, collectFilterCounts } from "../../lib/content";
import PostsTimeline from "../../components/blog/PostsTimeline";
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
  const allEntries = await getPublicTimelineEntries();
  const activeTag = typeof sp?.tag === "string" && sp.tag.trim() ? sp.tag.trim() : null;
  const tags = collectFilterCounts(allEntries);
  const posts = activeTag
    ? allEntries.filter((post) => collectEntryFilters(post).includes(activeTag))
    : allEntries;

  return (
    <section>
      <header className="page-header">
        <h1>Posts</h1>
        {renderHeader(tags, activeTag)}
      </header>

      <PostsTimeline entries={posts} layout="posts-list" initialVisibleCount={6} />
    </section>
  );
}
