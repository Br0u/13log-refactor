import HtmlContent from "../components/HtmlContent";
import BlogRail from "../../components/blog/BlogRail";
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
  const entries = getLinkEntries();
  const [introHtml, renderedEntries] = await Promise.all([
    renderMarkdown(intro.content || ""),
    Promise.all(entries.map(async (entry) => {
      const descriptionSource = entry.content || entry.description || "";
      return {
        ...entry,
        descriptionHtml: descriptionSource ? await renderMarkdown(descriptionSource) : "",
      };
    })),
  ]);

  const groups = renderedEntries.reduce((acc, item) => {
    const key = item.category || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="blog-layout blog-layout--link-index">
      <BlogRail variant="link" hideIntroCard />
      <section className="blog-layout__main">
        <header className="page-header">
          <h1>{intro.title}</h1>
          {intro.description ? <div className="post-description">{intro.description}</div> : null}
        </header>

        {intro.content ? <HtmlContent html={introHtml} className="post-content" /> : null}

        {Object.keys(groups).map((category, idx, arr) => (
          <section className="link-essay-group" key={category}>
            <h2 className="link-section-title">{CATEGORY_TITLE[category] || category}</h2>
            <div className="link-essay-list">
              {groups[category].map((entry) => {
                const hasAsyncPreview = !entry.image || !entry.description;
                return (
                  <article
                    key={entry.slug}
                    className={`link-essay-entry ${hasAsyncPreview ? "link-board-card--preview-pending" : ""}`}
                    data-link-card
                    data-preview-enabled="true"
                    data-preview-url={entry.link}
                  >
                    <div className="link-essay-entry__layout">
                      <div className="link-essay-entry__main">
                        <div className="link-essay-entry__eyebrow">
                          {entry.site ? <span className="link-essay-entry__site">{entry.site}</span> : null}
                        </div>

                        <h3 className="link-essay-entry__title">
                          <span data-preview-title>{entry.title}</span>
                        </h3>

                        <HtmlContent
                          html={entry.descriptionHtml || `<p class="is-empty" data-preview-desc>${entry.description || ""}</p>`}
                          className="link-essay-entry__body"
                          executeScripts={false}
                        />

                        {!entry.descriptionHtml ? <p className="link-essay-entry__desc-fallback is-empty" data-preview-desc /> : null}

                        {entry.children?.length ? (
                          <div className="link-essay-entry__related">
                            {entry.children.map((child) => (
                              <a className="link-essay-entry__related-link" href={child.link} key={child.link} target="_blank" rel="noopener noreferrer">
                                <span className="link-essay-entry__related-title">{child.title}</span>
                                {child.description ? <span className="link-essay-entry__related-desc">{child.description}</span> : null}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className={`link-essay-entry__preview ${entry.image ? "" : "is-empty"}`} data-preview-container>
                        {entry.image ? <img src={entry.image} alt="" loading="lazy" decoding="async" data-preview-image /> : null}
                      </div>
                    </div>
                    <a
                      className="entry-link"
                      href={entry.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`link to ${entry.title}`}
                    />
                  </article>
                );
              })}
            </div>
            {idx < arr.length - 1 ? <div className="ink-divider" aria-hidden="true" /> : null}
          </section>
        ))}

        <aside className="link-mobile-quote" aria-label="Link note">
          <span className="link-mobile-quote__mark" aria-hidden="true">“</span>
          <p>链接是记忆的锚点，<br />也是通往远方的路。</p>
        </aside>
      </section>
    </div>
  );
}
