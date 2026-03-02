import { notFound } from "next/navigation";
import Link from "next/link";
import HtmlContent from "../../components/HtmlContent";
import { buildTocHtml, formatPostMeta, getAdjacentEntries, getCodingPostBySlug, getCodingPosts, renderMarkdown, withHeadingAnchors } from "../../../lib/content";

function resolveSlug(raw) {
  if (!raw) return "";
  if (Array.isArray(raw)) raw = raw[0];
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function generateStaticParams() {
  return getCodingPosts().map((post) => ({ slug: post.urlSlug || post.slug }));
}

export async function generateMetadata({ params }) {
  const p = await params;
  const slug = resolveSlug(p?.slug);
  const post = getCodingPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: `${post.title} | 我的小小世界`,
    description: post.description || "",
  };
}

export default async function CodingDetailPage({ params }) {
  const p = await params;
  const slug = resolveSlug(p?.slug);
  const post = getCodingPostBySlug(slug);
  if (!post) notFound();

  const html = withHeadingAnchors(await renderMarkdown(post.content));
  const tocHtml = buildTocHtml(html);
  const { prev, next } = getAdjacentEntries("coding", post.slug);

  return (
    <article className="post-single">
      <header className="post-header">
        <h1 className="post-title">{post.title}</h1>
        <div className="post-meta">{formatPostMeta(post)}</div>
      </header>
      {tocHtml ? <div dangerouslySetInnerHTML={{ __html: tocHtml }} /> : null}
      <HtmlContent html={html} className="post-content" />
      {(post.tags?.length || prev || next) ? (
        <footer className="post-footer">
          {post.tags?.length ? (
            <ul className="post-tags">
              {post.tags.map((tag) => (
                <li key={tag}><span>{tag}</span></li>
              ))}
            </ul>
          ) : null}

          {(prev || next) ? (
            <nav className="post-nav-links">
              {prev ? <Link className="prev" href={`/coding/${encodeURIComponent(prev.urlSlug || prev.slug)}`}>{"<- "}{prev.title}</Link> : <span />}
              {next ? <Link className="next" href={`/coding/${encodeURIComponent(next.urlSlug || next.slug)}`}>{next.title}{" ->"}</Link> : null}
            </nav>
          ) : null}
        </footer>
      ) : null}
    </article>
  );
}
