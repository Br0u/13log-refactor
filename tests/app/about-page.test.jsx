import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../../app/components/HtmlContent", () => ({
  default: function HtmlContent({ html, className }) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  },
}));

vi.mock("../../components/ui/expand-map", () => ({
  LocationMap: function LocationMap({ location, coordinates }) {
    return (
      <div data-map>
        <span>{location}</span>
        <span>{coordinates}</span>
      </div>
    );
  },
}));

vi.mock("../../components/about/AboutGuestbook", () => ({
  default: function AboutGuestbook() {
    return <section className="about-guestbook">Guestbook</section>;
  },
}));

vi.mock("../../lib/content", () => ({
  getAboutPage: () => ({
    title: "About",
    description: "A quiet note.",
    content: "## Section\n\nAbout body.",
  }),
  renderMarkdown: vi.fn(async () => '<figure class="about-hero-wrap"><div class="about-hero"><img src="/images/aboutme.png" alt="About me" /></div></figure><h2>Section</h2><p>About body.</p>'),
}));

import AboutPage from "../../app/about/page";

describe("about page", () => {
  it("renders editorial framing without the literal about page title", async () => {
    const element = await AboutPage();
    const markup = renderToStaticMarkup(element);
    const locationIndex = markup.indexOf("about-note__location");
    const guestbookIndex = markup.indexOf("about-guestbook");
    const footerIndex = markup.indexOf("about-note__footer");

    expect(markup).toContain("about-note-layout");
    expect(markup).toContain("A NOTE");
    expect(markup).toContain("about-note");
    expect(markup).toContain("about-note__media");
    expect(markup).toContain('class="about-note-layout__media about-note__media"><figure class="about-hero-wrap"');
    expect(markup).toContain('class="about-note-layout__article"><article class="post-single about-note">');
    expect(markup).toContain("about-note__eyebrow");
    expect(markup).toContain("about-guestbook");
    expect(markup).toContain("Current Location");
    expect(markup).toContain("about-note__map-rail");
    expect(markup).toContain("about-note__location about-note__location--wide");
    expect(markup).toContain("about-note__map-shell about-note__map-shell--banner");
    expect(locationIndex).toBeGreaterThan(-1);
    expect(guestbookIndex).toBeGreaterThan(-1);
    expect(footerIndex).toBeGreaterThan(-1);
    expect(locationIndex).toBeLessThan(guestbookIndex);
    expect(locationIndex).toBeLessThan(footerIndex);
    expect(markup).not.toContain("<h1");
    expect(markup).not.toContain(">About<");
    expect(markup).toContain('class="post-content about-note__content"><h2>Section</h2><p>About body.</p>');
  });
});
