import { notFound } from "next/navigation";
import Link from "next/link";
import HtmlContent from "../../components/HtmlContent";
import { buildTocHtml, formatPostMeta, getPostBySlug, getPosts, renderMarkdown, withHeadingAnchors } from "../../../lib/content";

function resolveSlug(raw) {
  if (!raw) return "";
  if (Array.isArray(raw)) raw = raw[0];
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function pickRelatedPosts(currentPost, allPosts, limit = 6) {
  const currentTags = new Set(currentPost.tags || []);

  return allPosts
    .filter((item) => item.slug !== currentPost.slug)
    .map((item) => {
      const overlap = (item.tags || []).reduce((count, tag) => (currentTags.has(tag) ? count + 1 : count), 0);
      return { item, overlap };
    })
    .sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      if (!a.item.date && !b.item.date) return a.item.title.localeCompare(b.item.title);
      if (!a.item.date) return 1;
      if (!b.item.date) return -1;
      return b.item.date.localeCompare(a.item.date);
    })
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.urlSlug || post.slug }));
}

export async function generateMetadata({ params }) {
  const p = await params;
  const slug = resolveSlug(p?.slug);
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: `${post.title} | 鎴戠殑灏忓皬涓栫晫`,
    description: post.description || "",
  };
}

export default async function PostDetailPage({ params }) {
  const p = await params;
  const slug = resolveSlug(p?.slug);
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const html = withHeadingAnchors(await renderMarkdown(post.content));
  const tocHtml = buildTocHtml(html);
  const relatedPosts = pickRelatedPosts(post, getPosts());

  return (
    <>
      {relatedPosts.length ? (
        <aside className="post-related-rail" aria-label="Related Posts">
          <div className="post-related-rail__title">看看别的</div>
          <ul className="post-related-rail__list">
            {relatedPosts.map((item) => (
              <li key={item.slug} className="post-related-rail__item">
                <Link href={`/posts/${encodeURIComponent(item.urlSlug || item.slug)}`} className="post-related-rail__link">
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      <article className="post-single">
        <header className="post-header">
          <h1 className="post-title">{post.title}</h1>
          <div className="post-meta">{formatPostMeta(post)}</div>
        </header>
        {tocHtml ? <div dangerouslySetInnerHTML={{ __html: tocHtml }} /> : null}
        <HtmlContent html={html} className="post-content" />
        <footer className="post-footer">
          {post.tags?.length ? (
            <ul className="post-tags">
              {post.tags.map((tag) => (
                <li key={tag}><span>{tag}</span></li>
              ))}
            </ul>
          ) : null}
        </footer>
      </article>
    </>
  );
}
