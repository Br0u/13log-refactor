import Link from "next/link";
import { notFound } from "next/navigation";
import { collectTagCounts, formatListMeta, getPosts } from "../../../../lib/content";

const PAGE_SIZE = 12;

function renderPagination(currentPage, totalPages, basePath) {
  if (totalPages <= 1) return null;
  const prevHref = currentPage - 1 <= 1 ? `${basePath}` : `${basePath}/page/${currentPage - 1}`;
  const nextHref = `${basePath}/page/${currentPage + 1}`;

  return (
    <footer className="page-footer">
      <nav className="pagination">
        {currentPage > 1 ? <Link className="prev" href={prevHref}>{"<- Prev"}</Link> : null}
        {currentPage < totalPages ? <Link className="next" href={nextHref}>{"Next ->"}</Link> : null}
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

export default async function PostsPaged({ params }) {
  const p = await params;
  const pageNum = resolvePage(p?.page);
  const allPosts = getPosts();
  const totalPages = Math.max(1, Math.ceil(allPosts.length / PAGE_SIZE));
  if (!Number.isInteger(pageNum) || pageNum < 2 || pageNum > totalPages) notFound();

  const start = (pageNum - 1) * PAGE_SIZE;
  const posts = allPosts.slice(start, start + PAGE_SIZE);
  const tags = collectTagCounts(allPosts);

  return (
    <section>
      <header className="page-header">
        <h1>Posts</h1>
        {tags.length > 0 ? (
          <div className="posts-filter" data-posts-filter>
            <button type="button" className="posts-filter__chip is-active" data-filter="__all">全部</button>
            {tags.map((item) => (
              <button type="button" key={item.tag} className="posts-filter__chip" data-filter={item.tag}>
                {item.tag}
                <span className="posts-filter__count" aria-hidden="true">{item.count > 99 ? "99+" : item.count}</span>
              </button>
            ))}
          </div>
        ) : null}
      </header>

      <div className="posts-masonry">
        {posts.map((post) => {
          const excerpt = post.description || post.summary || "";
          return (
            <article className="post-entry" key={post.slug} data-post-tags={(post.tags || []).join("|")}>
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
