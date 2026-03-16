import React from "react";
import Link from "next/link";
import { collectEntryFilters, collectFilterCounts } from "../../lib/content";
import PostsTimeline from "../../components/blog/PostsTimeline";
import { getPublicTimelineEntries } from "../../lib/public-content";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

function renderPagination(currentPage, totalPages, basePath) {
  if (totalPages <= 1) return null;
  const prevHref = currentPage - 1 <= 1 ? `${basePath}` : `${basePath}/page/${currentPage - 1}`;
  const nextHref = `${basePath}/page/${currentPage + 1}`;

  return (
    <footer className="page-footer">
      <nav className="pagination">
        {currentPage > 1 ? <Link className="prev" href={prevHref}>/上一页</Link> : <span className="pagination__ghost" aria-hidden="true" />}
        <span className="pagination__meta">{currentPage} / {totalPages}</span>
        {currentPage < totalPages ? <Link className="next" href={nextHref}>/下一页</Link> : <span className="pagination__ghost" aria-hidden="true" />}
      </nav>
    </footer>
  );
}

export const metadata = {
  title: "Posts | 我的小小世界",
};

function renderHeader(tags, activeTag) {
  if (tags.length === 0) return null;
  return (
    <div className="posts-filter" data-posts-filter>
      <button
        type="button"
        className={`posts-filter__chip${!activeTag ? " is-active" : ""}`}
        data-filter="__all"
        data-filter-label="全部"
        aria-pressed={!activeTag ? "true" : "false"}
      >
        /全部
      </button>
      {tags.map((item) => (
        <button
          type="button"
          key={item.tag}
          className={`posts-filter__chip${activeTag === item.tag ? " is-active" : ""}`}
          data-filter={item.tag}
          data-filter-label={item.tag}
          aria-pressed={activeTag === item.tag ? "true" : "false"}
        >
          /{item.tag}
        </button>
      ))}
    </div>
  );
}

export default async function PostsPage({ searchParams }) {
  const sp = await searchParams;
  const allEntries = await getPublicTimelineEntries();
  const totalPages = Math.max(1, Math.ceil(allEntries.length / PAGE_SIZE));
  const activeTag = typeof sp?.tag === "string" && sp.tag.trim() ? sp.tag.trim() : null;
  const tags = collectFilterCounts(allEntries);
  const filteredPosts = activeTag
    ? allEntries.filter((post) => collectEntryFilters(post).includes(activeTag))
    : null;
  const posts = filteredPosts || allEntries.slice(0, PAGE_SIZE);

  return (
    <section>
      <header className="page-header">
        <h1>Posts</h1>
        {renderHeader(tags, activeTag)}
      </header>

      <PostsTimeline entries={posts} />

      {!activeTag ? renderPagination(1, totalPages, "/posts") : null}
    </section>
  );
}
