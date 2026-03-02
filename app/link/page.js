import HtmlContent from "../components/HtmlContent";
import { getLinkEntries, getLinkPageIntro, renderMarkdown } from "../../lib/content";

export const metadata = {
  title: "Link | 我的小小世界",
};

const CATEGORY_TITLE = {
  tech: "Tech Blogs",
  content: "Content Blogs",
  podcast: "Chinese Podcasts",
  other: "Others",
};

export default async function LinkPage() {
  const intro = getLinkPageIntro();
  const introHtml = await renderMarkdown(intro.content || "");
  const entries = getLinkEntries();

  const groups = entries.reduce((acc, item) => {
    const key = item.category || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <section>
      <header className="page-header">
        <h1>{intro.title}</h1>
        {intro.description ? <div className="post-description">{intro.description}</div> : null}
      </header>

      {intro.content ? <HtmlContent html={introHtml} className="post-content" /> : null}

      {Object.keys(groups).map((category, idx, arr) => (
        <div key={category}>
          <h2 className="link-section-title">{CATEGORY_TITLE[category] || category}</h2>
          <div className="posts-masonry">
            {groups[category].map((entry) => {
              const hasAsyncPreview = !entry.image || !entry.description;
              return (
                <article
                  key={entry.slug}
                  className={`link-board-card ${hasAsyncPreview ? "link-board-card--preview-pending" : ""}`}
                  data-link-card
                  data-preview-enabled="true"
                  data-preview-url={entry.link}
                >
                  <a className="link-board-card__main" href={entry.link} target="_blank" rel="noopener noreferrer">
                    <div className={`link-board-card__preview ${entry.image ? "" : "is-empty"}`} data-preview-container>
                      {entry.image ? <img src={entry.image} alt="" loading="lazy" decoding="async" data-preview-image /> : null}
                    </div>
                    <div className="link-board-card__title" data-preview-title>{entry.title}</div>
                    <div className={`link-board-card__desc ${entry.description ? "" : "is-empty"}`} data-preview-desc>{entry.description}</div>
                    {entry.site ? <div className="link-board-card__meta">{entry.site}</div> : null}
                  </a>

                  {entry.children?.length ? (
                    <div className="link-board-children">
                      {entry.children.map((child) => (
                        <a className="link-board-child" href={child.link} key={child.link} target="_blank" rel="noopener noreferrer">
                          <div className="link-board-child__title">{child.title}</div>
                          {child.description ? <div className="link-board-child__desc">{child.description}</div> : null}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
          {idx < arr.length - 1 ? <div className="ink-divider" aria-hidden="true" /> : null}
        </div>
      ))}
    </section>
  );
}
