import Link from "next/link";
import { notFound } from "next/navigation";
import { collectTagCounts, formatListMeta, getCodingIndex, getCodingPosts, renderMarkdown } from "../../../../lib/content";
import HtmlContent from "../../../components/HtmlContent";

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
  const allPosts = getCodingPosts();
  const totalPages = Math.max(1, Math.ceil(allPosts.length / PAGE_SIZE));
  return Array.from({ length: totalPages - 1 }, (_, i) => ({ page: String(i + 2) }));
}

export async function generateMetadata({ params }) {
  return { title: `Coding | 我的小小世界` };
}

export default async function CodingPaged({ params }) {
  const p = await params;
  const pageNum = resolvePage(p?.page);
  const allPosts = getCodingPosts();
  const totalPages = Math.max(1, Math.ceil(allPosts.length / PAGE_SIZE));
  if (!Number.isInteger(pageNum) || pageNum < 2 || pageNum > totalPages) notFound();

  const start = (pageNum - 1) * PAGE_SIZE;
  const posts = allPosts.slice(start, start + PAGE_SIZE);
  const tags = collectTagCounts(allPosts);
  const index = getCodingIndex();
  const intro = await renderMarkdown(index.content || "");

  return (
    <section>
      <header className="page-header">
        <h1>{index.title || "Coding"}</h1>
        <div className="post-description">{index.description || ""} Page {pageNum} / {totalPages}</div>
      </header>

      {index.content ? <HtmlContent html={intro} className="post-content" /> : null}

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

      <div className="posts-masonry">
        {posts.map((post) => {
          const excerpt = post.description || post.summary || "";
          return (
            <article className="post-entry" key={post.slug} data-post-tags={(post.tags || []).join("|")}>
              <header className="entry-header"><h2>{post.title}</h2></header>
              {excerpt ? <div className="entry-content"><p>{excerpt}</p></div> : null}
              <footer className="entry-footer">{formatListMeta(post)}</footer>
              <Link className="entry-link" aria-label={`coding link to ${post.title}`} href={`/coding/${encodeURIComponent(post.urlSlug || post.slug)}`} />
            </article>
          );
        })}
      </div>

      {renderPagination(pageNum, totalPages, "/coding")}
    </section>
  );
}
