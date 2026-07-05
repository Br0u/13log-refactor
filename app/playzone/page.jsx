import BlogRail from "../../components/blog/BlogRail";
import { projects } from "./projects";

export const metadata = {
  title: "Playzone | 我的小小世界",
};

const filters = ["全部", "互动实验", "文本游戏", "视觉创意", "工具"];

export default function PlayzonePage() {
  return (
    <div className="blog-layout blog-layout--link-index playzone-layout">
      <BlogRail variant="link" hideIntroCard />
      <section className="blog-layout__main">
        <header className="page-header">
          <h1>Playzone</h1>
          <div className="post-description">个人小项目入口</div>
        </header>

        <div className="playzone-intro-copy">
          <p>一些好玩的实验性项目，<br />在这里记录、探索与玩耍。</p>
        </div>

        <nav className="playzone-filter" aria-label="Playzone categories">
          {filters.map((item, index) => (
            <span className={`playzone-filter__chip${index === 0 ? " is-active" : ""}`} key={item}>
              {item}
            </span>
          ))}
        </nav>

        <section className="link-essay-group" id="playzone-projects">
          <div className="link-essay-list">
            {projects.map((project) => (
              <article
                key={project.slug}
                className={`link-essay-entry ${!project.image ? "link-board-card--preview-pending" : ""}`}
                data-link-card
                data-preview-enabled="true"
                data-preview-url={project.href}
              >
                <div className="link-essay-entry__layout">
                  <div className="link-essay-entry__main">
                    <div className="link-essay-entry__eyebrow">
                      <span className="link-essay-entry__site">{project.eyebrow || "Project"}</span>
                    </div>

                    <h2 className="link-essay-entry__title">
                      <span data-preview-title>{project.title}</span>
                    </h2>

                    {project.tags?.length ? (
                      <div className="playzone-project-tags" aria-label={`${project.title} tags`}>
                        {project.tags.map((tag) => (
                          <span className="playzone-project-tag" key={tag}>{tag}</span>
                        ))}
                      </div>
                    ) : null}

                    <p className="link-essay-entry__body is-empty" data-preview-desc>
                      {project.description}
                    </p>

                    <span className="playzone-project-cta" aria-hidden="true">
                      {project.cta || "进入项目"} <span>→</span>
                    </span>
                  </div>

                  <div className="link-essay-entry__preview is-empty" data-preview-container />
                </div>
                <a
                  className="entry-link"
                  href={project.href}
                  target={project.external ? "_blank" : undefined}
                  rel={project.external ? "noopener noreferrer" : undefined}
                  aria-label={`link to ${project.title}`}
                />
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
