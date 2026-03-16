import React from "react";
import Link from "next/link";

function normalizeSummaryText(value = "") {
  return String(value)
    .replace(/[#>*_`~\-]+/g, " ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function collectEntryFilters(entry) {
  return Array.from(new Set([...(entry?.categories || []), ...(entry?.tags || [])]));
}

function formatListDate(dateIso) {
  if (!dateIso) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(dateIso));
}

function getPrimaryEntryLabel(entry) {
  const category = Array.isArray(entry?.categories) ? entry.categories.find(Boolean) : null;
  if (category) return category;
  const tag = Array.isArray(entry?.tags) ? entry.tags.find(Boolean) : null;
  return tag || "";
}

function formatMicroTime(dateIso) {
  if (!dateIso) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateIso));
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
}) {
  const filterTags = collectEntryFilters(post);
  const isMicro = post.type === "micro";
  const primaryLabel = getPrimaryEntryLabel(post);
  const href = post.href || `/posts/${encodeURIComponent(post.urlSlug || post.slug)}`;
  const summary = normalizeSummaryText(post.summary || post.description || post.content || "");
  const microDate = getMicroDateParts(post.date);
  const cardClassName = [
    "post-entry",
    "post-preview-card",
    isMicro ? "post-preview-card--micro" : "post-preview-card--post",
    focusState === "active" ? "is-micro-active" : "",
    focusState === "background" ? "is-micro-background" : "",
  ].filter(Boolean).join(" ");

  return (
    <article
      className={cardClassName}
      data-post-tags={filterTags.join("|")}
      data-testid={dataTestId}
      data-focus-state={focusState}
      onClick={isMicro ? onMicroToggle : undefined}
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
        <div className="post-preview-card__micro-surface">
          {summary ? (
            <div className="post-preview-card__content">
              <p className="post-preview-card__excerpt-block">{summary}</p>
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
