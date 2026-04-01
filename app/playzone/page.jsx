import BlogRail from "../../components/blog/BlogRail";
import { projects } from "./projects";

export const metadata = {
  title: "Playzone | 我的小小世界",
};

export default function PlayzonePage() {
  return (
    <div className="blog-layout blog-layout--link-index playzone-layout">
      <BlogRail
        variant="link"
        introTitle="Playzone"
        introBody="这里放一些自己的小项目，像 link 页一样按条目浏览。"
      />
      <section className="blog-layout__main">
        <header className="page-header">
          <h1>Playzone</h1>
          <div className="post-description">个人小项目入口</div>
        </header>

        <section className="link-essay-group">
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
                  <span className="link-essay-entry__site">Project</span>
                </div>

                <h2 className="link-essay-entry__title">
                  <span data-preview-title>{project.title}</span>
                </h2>

                <p className="link-essay-entry__body is-empty" data-preview-desc>
                  {project.description}
                </p>
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
