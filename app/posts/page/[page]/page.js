import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { collectEntryFilters, collectFilterCounts, formatListMeta, getPosts } from "../../../../lib/content";

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

function resolvePage(raw) {
  if (!raw) return NaN;
  if (Array.isArray(raw)) raw = raw[0];
  return Number(raw);
}

export function generateStaticParams() {
  const allPosts = getPosts();
  const totalPages = Math.max(1, Math.ceil(allPosts.length / PAGE_SIZE));
  return Array.from({ length: totalPages - 1 }, (_, i) => ({ page: String(i + 2) }));
}

export async function generateMetadata({ params }) {
  const p = await params;
  return { title: `Posts | 我的小小世界` };
}

function renderHeader(tags) {
  if (tags.length === 0) return null;
  return (
    <div className="posts-filter" data-posts-filter>
      <button
        type="button"
        className="posts-filter__chip is-active"
        data-filter="__all"
        data-filter-label="全部"
        aria-pressed="true"
      >
        /全部
      </button>
      {tags.map((item) => (
        <button
          type="button"
          key={item.tag}
          className="posts-filter__chip"
          data-filter={item.tag}
          data-filter-label={item.tag}
          aria-pressed="false"
        >
          /{item.tag}
        </button>
      ))}
    </div>
  );
}

export default async function PostsPaged({ params, searchParams }) {
  const p = await params;
  const sp = await searchParams;
  const activeTag = typeof sp?.tag === "string" && sp.tag.trim() ? sp.tag.trim() : null;
  if (activeTag) redirect(`/posts?tag=${encodeURIComponent(activeTag)}`);
  const pageNum = resolvePage(p?.page);
  const allPosts = getPosts();
  const totalPages = Math.max(1, Math.ceil(allPosts.length / PAGE_SIZE));
  if (!Number.isInteger(pageNum) || pageNum < 2 || pageNum > totalPages) notFound();

  const start = (pageNum - 1) * PAGE_SIZE;
  const posts = allPosts.slice(start, start + PAGE_SIZE);
  const tags = collectFilterCounts(allPosts);

  return (
    <section>
      <header className="page-header">
        <h1>Posts</h1>
        {renderHeader(tags)}
      </header>

      <div className="posts-masonry">
        {posts.map((post) => {
          const excerpt = post.description || post.summary || "";
          const filterTags = collectEntryFilters(post);
          return (
            <article className="post-entry" key={post.slug} data-post-tags={filterTags.join("|")}>
              <header className="entry-header"><h2>{post.title}</h2></header>
              {excerpt ? <div className="entry-content"><p>{excerpt}</p></div> : null}
              <footer className="entry-footer">{formatListMeta(post)}</footer>
              <Link className="entry-link" aria-label={`post link to ${post.title}`} href={`/posts/${encodeURIComponent(post.urlSlug || post.slug)}`} />
            </article>
          );
        })}
      </div>

      {renderPagination(pageNum, totalPages, "/posts")}
    </section>
  );
}
