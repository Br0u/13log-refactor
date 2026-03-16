import React from "react";
import HtmlContent from "../components/HtmlContent";
import AboutGuestbook from "../../components/about/AboutGuestbook";
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

function extractLeadHero(html = "") {
  const source = html || "";
  const match = source.match(/<figure class="about-hero-wrap">[\s\S]*?<\/figure>/i);
  if (!match) return { heroHtml: "", bodyHtml: source };

  return {
    heroHtml: match[0],
    bodyHtml: source.replace(match[0], "").trim(),
  };
}

export default async function AboutPage() {
  const about = getAboutPage();
  const cleanedContent = stripLegacyMapSection(about.content || "");
  const html = await renderMarkdown(cleanedContent);
  const { heroHtml, bodyHtml } = extractLeadHero(html);
  return (
    <section className="about-note-layout">
      {heroHtml ? (
        <aside
          className="about-note-layout__media about-note__media"
          dangerouslySetInnerHTML={{ __html: heroHtml }}
        />
      ) : null}

      <div className="about-note-layout__article">
        <article className="post-single about-note">
          <header className="post-header about-note__header">
            <div className="about-note__intro-copy">
              <p className="about-note__eyebrow">A NOTE</p>
              {about.description ? <p className="post-description about-note__dek">{about.description}</p> : null}
            </div>
          </header>

          <div className="about-note__body">
            <HtmlContent html={bodyHtml} className="post-content about-note__content" />
          </div>

          <section className="about-note__map-rail">
            <section className="about-map about-note__location about-note__location--wide" aria-labelledby="about-location-title">
              <div className="about-note__location-header">
                <p className="about-note__location-kicker">From</p>
                <h2 id="about-location-title" className="about-note__location-title">Current Location</h2>
              </div>

              <div className="about-note__map-shell about-note__map-shell--banner">
                <LocationMap
                  className="about-note__map-frame"
                  location="Toronto, Ontario"
                  coordinates="43.6532° N, 79.3832° W"
                />
              </div>
            </section>
          </section>

          <footer className="about-note__footer">
            <AboutGuestbook />
          </footer>
        </article>
      </div>
    </section>
  );
}
