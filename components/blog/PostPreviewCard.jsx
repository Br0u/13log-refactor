import React from "react";
import Link from "next/link";
import MicroPostLikeButton from "./MicroPostLikeButton";

const LIST_DATE_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const MICRO_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  hour: "numeric",
  minute: "2-digit",
  hour12: false,
});

function normalizeSummaryText(value = "") {
  return String(value)
    .replace(/[#>*_`~]+/g, " ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function injectMicroImageClass(html) {
  return String(html).replace(/<img\b([^>]*)>/gi, (match, attrs = "") => {
    const classAttrMatch = attrs.match(/\sclass\s*=\s*(['"])(.*?)\1/i);
    if (classAttrMatch) {
      const quote = classAttrMatch[1];
      const existingClasses = classAttrMatch[2]
        .split(/\s+/)
        .map((value) => value.trim())
        .filter(Boolean);

      if (!existingClasses.includes("post-preview-card__micro-image")) {
        existingClasses.push("post-preview-card__micro-image");
      }

      const nextClassAttr = ` class=${quote}${existingClasses.join(" ")}${quote}`;
      const nextAttrs = attrs.replace(/\sclass\s*=\s*(['"])(.*?)\1/i, nextClassAttr);
      return `<img${nextAttrs}>`;
    }

    return `<img${attrs} class="post-preview-card__micro-image">`;
  });
}

function createMicroMarkup(post) {
  const baseMarkup = post.renderedContentHtml || `<p>${normalizeSummaryText(post.summary || post.description || post.content || "")}</p>`;
  return injectMicroImageClass(baseMarkup);
}

function formatListDate(dateIso) {
  if (!dateIso) return "";
  return LIST_DATE_FORMATTER.format(new Date(dateIso));
}

function getPrimaryEntryLabel(entry) {
  const category = Array.isArray(entry?.categories) ? entry.categories.find(Boolean) : null;
  if (category) return category;
  const tag = Array.isArray(entry?.tags) ? entry.tags.find(Boolean) : null;
  return tag || "";
}

function formatMicroTime(dateIso) {
  if (!dateIso) return "";
  return MICRO_TIME_FORMATTER.format(new Date(dateIso));
}

function getMicroDateParts(dateIso) {
  if (!dateIso) {
    return { month: "", day: "", year: "", time: "" };
  }

  const date = new Date(dateIso);
  return {
    month: String(date.getMonth() + 1),
    day: String(date.getDate()),
    year: String(date.getFullYear()),
    time: formatMicroTime(dateIso),
  };
}

export default function PostPreviewCard({
  post,
  dataTestId,
  focusState = "idle",
  onMicroToggle,
  microScrollChrome,
  isExpandedMicro = false,
}) {
  const isMicro = post.type === "micro";
  const primaryLabel = getPrimaryEntryLabel(post);
  const href = post.href || `/posts/${encodeURIComponent(post.urlSlug || post.slug)}`;
  const summary = normalizeSummaryText(post.summary || post.description || post.content || "");
  const microDate = getMicroDateParts(post.date);
  const microMarkup = isMicro ? createMicroMarkup(post) : "";
  const showMicroScrollRange = isMicro && microScrollChrome;
  const cardClassName = [
    "post-entry",
    "post-preview-card",
    isMicro ? "post-preview-card--micro" : "post-preview-card--post",
    isExpandedMicro ? "post-preview-card--micro-expanded" : "",
    focusState === "active" ? "is-micro-active" : "",
    focusState === "background" ? "is-micro-background" : "",
  ].filter(Boolean).join(" ");

  return (
    <article
      className={cardClassName}
      data-testid={dataTestId}
      data-focus-state={focusState}
      onClick={isMicro && !isExpandedMicro ? onMicroToggle : undefined}
    >
      <header className="post-preview-card__header">
        {!isMicro && (post.date || primaryLabel) ? (
          <div className="post-preview-card__meta post-preview-card__header-meta">
            {post.date ? <time dateTime={post.date}>{formatListDate(post.date)}</time> : null}
            {post.date && primaryLabel ? <span className="post-preview-card__divider">|</span> : null}
            {primaryLabel ? <span className="post-preview-card__label">{primaryLabel}</span> : null}
          </div>
        ) : null}
        {!isMicro ? (
          <h2 className="post-preview-card__title">
            <Link href={href}>{post.title}</Link>
          </h2>
        ) : null}
      </header>

      {isMicro ? (
        <div
          className="post-preview-card__micro-surface"
          data-testid={dataTestId ? `${dataTestId}-surface` : undefined}
          data-micro-placement={showMicroScrollRange ? microScrollChrome.placement || "down" : undefined}
          style={showMicroScrollRange && microScrollChrome.surfaceMaxHeight
            ? { "--micro-surface-max-height": `${microScrollChrome.surfaceMaxHeight}px` }
            : undefined}
        >
          {showMicroScrollRange ? (
            <div
              className="post-preview-card__micro-scroll-range"
              data-testid={dataTestId ? `${dataTestId}-scroll-range` : undefined}
              data-scrollable={microScrollChrome.isScrollable ? "true" : "false"}
              data-scroll-hint-active={microScrollChrome.isHintActive ? "true" : "false"}
              style={{
                "--micro-scroll-progress": String(microScrollChrome.progress ?? 0),
                "--micro-scroll-window": String(microScrollChrome.viewportRatio ?? 1),
              }}
              aria-hidden="true"
            >
              <span className="post-preview-card__micro-scroll-thumb" />
            </div>
          ) : null}
          {microMarkup ? (
            <div className="post-preview-card__content">
              <div
                className="post-preview-card__micro-richtext post-preview-card__excerpt-block"
                dangerouslySetInnerHTML={{ __html: microMarkup }}
              />
            </div>
          ) : null}

          <footer className="post-preview-card__micro-meta">
            <span className="post-preview-card__micro-date">
              <span className="post-preview-card__micro-calendar" aria-hidden="true">⊡</span>
              <time className="post-preview-card__micro-calendar-meta" dateTime={post.date || ""}>
                <span className="post-preview-card__micro-month">{microDate.month}</span> 月
                <span className="post-preview-card__micro-day">{microDate.day}</span> 日,
                <span className="post-preview-card__micro-year">{microDate.year}</span>
              </time>
              <span className="post-preview-card__micro-divider" aria-hidden="true">|</span>
              <span className="post-preview-card__micro-clock" aria-hidden="true">◷</span>
              <span className="post-preview-card__micro-time">{microDate.time}</span>
            </span>
            <MicroPostLikeButton
              id={post.id}
              initialCount={post.likeCount || 0}
              dataTestId={dataTestId ? `${dataTestId}-like` : undefined}
            />
          </footer>
        </div>
      ) : summary ? (
        <div className="post-preview-card__content">
          <p className="post-preview-card__excerpt-block">{summary}</p>
        </div>
      ) : null}

      {!isMicro ? <Link className="entry-link" aria-label={`post link to ${post.title}`} href={href} /> : null}
    </article>
  );
}
