import Link from "next/link";
import { getSearchDocuments } from "../../lib/content";

export const metadata = {
  title: "Search | 13log",
};

function scoreDoc(doc, q) {
  const t = (doc.title || "").toLowerCase();
  const d = (doc.description || "").toLowerCase();
  const c = (doc.content || "").toLowerCase();
  const tags = (doc.tags || []).join(" ").toLowerCase();
  if (t.includes(q)) return 4;
  if (tags.includes(q)) return 3;
  if (d.includes(q)) return 2;
  if (c.includes(q)) return 1;
  return 0;
}

export default async function SearchPage({ searchParams }) {
  const docs = getSearchDocuments();
  const qRaw = searchParams?.q || "";
  const q = qRaw.trim().toLowerCase();

  const results = q
    ? docs
        .map((doc) => ({ doc, score: scoreDoc(doc, q) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => {
          if (a.score !== b.score) return b.score - a.score;
          if (!a.doc.date && !b.doc.date) return a.doc.title.localeCompare(b.doc.title);
          if (!a.doc.date) return 1;
          if (!b.doc.date) return -1;
          return b.doc.date.localeCompare(a.doc.date);
        })
    : [];

  return (
    <section>
      <header className="page-header">
        <h1>Search</h1>
        <div className="post-description">Search posts and link board entries.</div>
      </header>

      <form action="/search" method="get" className="search-form">
        <input
          type="search"
          name="q"
          defaultValue={qRaw}
          placeholder="Type keywords..."
          className="search-input"
        />
        <button type="submit" className="search-btn">Search</button>
      </form>

      {q ? (
        <div className="search-meta">{results.length} results for "{qRaw}"</div>
      ) : (
        <div className="search-meta">Enter keywords to start searching.</div>
      )}

      <div className="posts-masonry">
        {results.map(({ doc }) => (
          <article className="post-entry" key={`${doc.section}-${doc.slug}`}>
            <header className="entry-header"><h2>{doc.title}</h2></header>
            {doc.description ? <div className="entry-content"><p>{doc.description}</p></div> : null}
            <footer className="entry-footer">{doc.section}{doc.date ? ` 路 ${new Date(doc.date).toLocaleDateString("zh-CN")}` : ""}</footer>
            <Link className="entry-link" href={doc.url} aria-label={`search result ${doc.title}`} />
          </article>
        ))}
      </div>
    </section>
  );
}