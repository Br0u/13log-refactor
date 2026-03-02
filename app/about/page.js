import HtmlContent from "../components/HtmlContent";
import { LocationMap } from "../../components/ui/expand-map";
import { getAboutPage, renderMarkdown } from "../../lib/content";

export const metadata = {
  title: "About | 我的小小世界",
};

function stripLegacyMapSection(markdown = "") {
  const source = markdown || "";
  const marker = '<link rel="stylesheet" href="https://unpkg.com/maplibre-gl';
  const index = source.indexOf(marker);
  if (index < 0) return source;

  const head = source.slice(0, index);
  // remove trailing horizontal rule before legacy map block
  return head.replace(/[\r\n]+---[\r\n\s]*$/, "").trimEnd();
}

export default async function AboutPage() {
  const about = getAboutPage();
  const cleanedContent = stripLegacyMapSection(about.content || "");
  const html = await renderMarkdown(cleanedContent);

  return (
    <article className="post-single">
      <header className="post-header">
        <h1 className="post-title">{about.title}</h1>
        {about.description ? <div className="post-description">{about.description}</div> : null}
      </header>

      <HtmlContent html={html} className="post-content" />

      <section className="about-map mt-10">
        <div className="relative isolate mx-auto w-full max-w-[640px]">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_rgba(52,211,153,0.05)_0%,_transparent_72%)]" />

          <p
            className="mb-4 text-center text-[11px] font-medium uppercase tracking-[0.2em]"
            style={{ color: "var(--secondary)" }}
          >
            Current Location
          </p>

          <LocationMap location="Toronto, Ontario" coordinates="43.6532° N, 79.3832° W" />
        </div>
      </section>
    </article>
  );
}
