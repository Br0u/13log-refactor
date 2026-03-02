import { getRssItems } from "../../lib/content";

function esc(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.13log.live";
  const items = getRssItems(80);
  const lastBuildDate =
    items
      .map((item) => item.date)
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a))[0] || new Date().toISOString();

  const xmlItems = items
    .map((item) => {
      const pubDate = item.date ? new Date(item.date).toUTCString() : new Date().toUTCString();
      return `<item><title>${esc(item.title)}</title><link>${esc(item.link)}</link><pubDate>${pubDate}</pubDate><guid>${esc(
        item.link
      )}</guid><description>${esc(item.description)}</description></item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>13log</title><link>${esc(
    siteUrl
  )}/</link><description>Recent content on 13log</description><generator>Next.js</generator><language>zh-CN</language><lastBuildDate>${new Date(
    lastBuildDate
  ).toUTCString()}</lastBuildDate><atom:link href="${esc(siteUrl)}/rss.xml" rel="self" type="application/rss+xml" />${xmlItems}</channel></rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
