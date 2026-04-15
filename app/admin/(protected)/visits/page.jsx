import React from "react";
import AdminLocalTime from "../../../../components/admin/AdminLocalTime";
import {
  formatAuditPath,
  getAccessAuditPageData,
} from "../../../../lib/repositories/access-audit";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Visits | 13log Admin",
};

const VISIT_GROUP_WINDOW_MS = 10 * 60 * 1000;

function renderTopPages(summary) {
  return summary.topPages
    .map((item) => `${formatAuditPath(item.path)} (${item.count})`)
    .join(" · ") || "No visits yet.";
}

function renderInputValue(value) {
  return value || "";
}

function renderBadge(value, tone = "neutral") {
  const text = value || "-";
  return (
    <span className={`admin-audit-badge admin-audit-badge--${tone}`} title={text}>
      {text}
    </span>
  );
}

function renderRiskTone(riskLabel) {
  if (riskLabel === "bot") return "danger";
  if (riskLabel === "suspicious") return "warn";
  return "neutral";
}

function renderRiskScoreTone(score) {
  if (score >= 70) return "danger";
  if (score >= 30) return "warn";
  return "neutral";
}

function renderRefererHostname(referer = "") {
  if (!referer) return "Direct / Unknown";

  try {
    return new URL(referer).hostname || referer;
  } catch {
    return referer;
  }
}

function formatGroupTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toISOString().slice(11, 19);
}

function buildViewHref(filters, view) {
  const params = new URLSearchParams();

  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.riskLabel) params.set("riskLabel", filters.riskLabel);
  if (filters.blockReason) params.set("blockReason", filters.blockReason);
  if (filters.country) params.set("country", filters.country);
  if (filters.path) params.set("path", filters.path);
  if (filters.onlyFlagged) params.set("onlyFlagged", "true");
  params.set("view", view);

  return `/admin/visits?${params.toString()}`;
}

function getVisitGroupKey(visit) {
  return [visit.ipHash || "unknown-ip", visit.deviceSummary?.primary || "unknown-device"].join("::");
}

function buildVisitGroups(rows) {
  const groups = [];

  for (const visit of rows) {
    const currentTime = new Date(visit.createdAt).getTime();
    const lastGroup = groups.at(-1);
    const lastVisit = lastGroup?.visits.at(-1);
    const lastVisitTime = lastVisit ? new Date(lastVisit.createdAt).getTime() : 0;

    if (
      lastGroup
      && getVisitGroupKey(lastGroup.visits[0]) === getVisitGroupKey(visit)
      && lastVisitTime - currentTime <= VISIT_GROUP_WINDOW_MS
    ) {
      lastGroup.visits.push(visit);
      continue;
    }

    groups.push({
      id: `group-${visit.id}`,
      visits: [visit],
    });
  }

  return groups.map((group) => {
    const topPathCounts = new Map();
    const riskCounts = new Map();

    for (const visit of group.visits) {
      const displayPath = formatAuditPath(visit.path);
      topPathCounts.set(displayPath, (topPathCounts.get(displayPath) || 0) + 1);
      riskCounts.set(visit.riskLabel, (riskCounts.get(visit.riskLabel) || 0) + 1);
    }

    const topPath = [...topPathCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
    const riskSummary = [...riskCounts.entries()]
      .map(([label, count]) => `${count} ${label}`)
      .join(" · ");

    return {
      ...group,
      summary: {
        count: group.visits.length,
        latestTime: formatGroupTime(group.visits[0]?.createdAt),
        earliestTime: formatGroupTime(group.visits.at(-1)?.createdAt),
        topPath,
        riskSummary,
      },
    };
  });
}

function renderVisitRow(visit, { nested = false } = {}) {
  const displayPath = formatAuditPath(visit.path);
  const refererHostname = renderRefererHostname(visit.referer);

  return (
    <div
      key={visit.id}
      className={[
        "admin-table__row",
        "admin-table__row--audit",
        nested ? "admin-table__row--audit-nested" : "",
      ].filter(Boolean).join(" ")}
    >
      <span className="admin-table__content-cell admin-audit-stack admin-audit-stack--time">
        <span className="admin-audit-stack__title">
          <AdminLocalTime value={visit.createdAt} />
        </span>
        <span className="admin-audit-stack__meta">最近访问时间</span>
      </span>

      <span className="admin-table__content-cell admin-audit-stack">
        <span className="admin-audit-stack__eyebrow">Path</span>
        <span className="admin-audit-stack__title admin-audit-cell--path" title={displayPath}>
          {displayPath}
        </span>
        <span className="admin-audit-stack__eyebrow">Referer</span>
        <span className="admin-audit-stack__meta" title={visit.referer || "Direct / Unknown"}>
          {refererHostname}
        </span>
        <span className="admin-audit-stack__raw admin-audit-cell--referer" title={visit.referer || "-"}>
          {visit.referer || "-"}
        </span>
      </span>

      <span className="admin-table__content-cell admin-audit-stack">
        <span className="admin-audit-stack__eyebrow">Location</span>
        <span className="admin-audit-stack__title admin-audit-cell--location" title={visit.locationSummary?.primary || "-"}>
          {visit.locationSummary?.primary || "-"}
        </span>
        <span className="admin-audit-stack__meta">
          {visit.locationSummary?.secondary || "Location unavailable"}
        </span>
        <span className="admin-audit-stack__eyebrow">Device</span>
        <span className="admin-audit-agent" title={visit.userAgent || "-"}>
          <span className="admin-audit-agent__headline">
            {visit.deviceSummary?.primary || "未知设备"}
          </span>
          <span className="admin-audit-agent__summary">
            <span className="admin-audit-badge admin-audit-badge--neutral">{visit.deviceSummary?.device || "未知设备类型"}</span>
            <span className="admin-audit-badge admin-audit-badge--neutral">{visit.deviceSummary?.browser || "未知浏览器"}</span>
            <span className="admin-audit-badge admin-audit-badge--neutral">{visit.deviceSummary?.os || "未知系统"}</span>
          </span>
          <span className="admin-audit-agent__raw">{visit.userAgent || "-"}</span>
        </span>
      </span>

      <span className="admin-table__content-cell admin-audit-stack">
        <span className="admin-audit-stack__eyebrow">Risk label</span>
        <span className="admin-audit-stack__badges">
          {renderBadge(visit.riskLabel, renderRiskTone(visit.riskLabel))}
          {renderBadge(`Score ${visit.riskScore}`, renderRiskScoreTone(visit.riskScore))}
        </span>
        <span className="admin-audit-stack__eyebrow">Enforcement</span>
        <span className="admin-audit-stack__badges">
          {renderBadge(visit.blockReason || "Not blocked", visit.blockReason ? "danger" : "neutral")}
          {renderBadge(visit.blacklistReason || "No blacklist", visit.blacklistReason ? "danger" : "neutral")}
        </span>
      </span>
    </div>
  );
}

export default async function AdminVisitsPage({ searchParams }) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const { filters, summary, riskSummary, rows } = await getAccessAuditPageData(resolvedSearchParams);
  const groupedRows = buildVisitGroups(rows);
  const view = resolvedSearchParams?.view === "raw" ? "raw" : "grouped";

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Traffic</p>
          <h1>Visits</h1>
          <p className="admin-page-copy">统一查看访问明细、风险标签、阻断结果与异常流量分布。</p>
        </div>
      </header>

      <section className="admin-page__panel admin-dashboard__grid admin-overview-grid">
        <article className="admin-overview-card">
          <p className="admin-overview-card__label">Today PV</p>
          <h2>{summary.todayCount}</h2>
          <p>今日累计页面访问。</p>
        </article>
        <article className="admin-overview-card">
          <p className="admin-overview-card__label">Last 7 Days</p>
          <h2>{summary.last7DaysCount}</h2>
          <p>近 7 天页面访问总量。</p>
        </article>
        <article className="admin-overview-card">
          <p className="admin-overview-card__label">Latest 100</p>
          <h2>{rows.length}</h2>
          <p>当前列表最多展示最近 100 条访问记录。</p>
        </article>
        <article className="admin-overview-card">
          <p className="admin-overview-card__label">Top Pages</p>
          <h2>{formatAuditPath(summary.topPages[0]?.path) || "-"}</h2>
          <p>{renderTopPages(summary)}</p>
        </article>
        <article className="admin-overview-card">
          <p className="admin-overview-card__label">Normal</p>
          <h2>{riskSummary.normal}</h2>
          <p>当前筛选范围内的正常访问。</p>
        </article>
        <article className="admin-overview-card">
          <p className="admin-overview-card__label">Suspicious</p>
          <h2>{riskSummary.suspicious}</h2>
          <p>被标记为可疑但未直接拦截的访问。</p>
        </article>
        <article className="admin-overview-card">
          <p className="admin-overview-card__label">Bot</p>
          <h2>{riskSummary.bot}</h2>
          <p>被判定为 bot 的高风险访问。</p>
        </article>
        <article className="admin-overview-card">
          <p className="admin-overview-card__label">Blocked</p>
          <h2>{riskSummary.blocked}</h2>
          <p>被风控直接阻断的请求数量。</p>
        </article>
      </section>

      <div className="admin-page__panel admin-page__panel--stacked">
        <form method="get" className="admin-form admin-audit-filters">
          <label>
            <span>From</span>
            <input type="date" name="from" defaultValue={renderInputValue(filters.from)} />
          </label>
          <label>
            <span>To</span>
            <input type="date" name="to" defaultValue={renderInputValue(filters.to)} />
          </label>
          <label>
            <span>Risk Label</span>
            <select name="riskLabel" defaultValue={renderInputValue(filters.riskLabel)}>
              <option value="">All</option>
              <option value="normal">normal</option>
              <option value="suspicious">suspicious</option>
              <option value="bot">bot</option>
            </select>
          </label>
          <label>
            <span>Block Reason</span>
            <select name="blockReason" defaultValue={renderInputValue(filters.blockReason)}>
              <option value="">All</option>
              <option value="rate_limit">rate_limit</option>
              <option value="bot">bot</option>
              <option value="blacklist">blacklist</option>
            </select>
          </label>
          <label>
            <span>country</span>
            <input type="text" name="country" placeholder="CA" defaultValue={renderInputValue(filters.country)} />
          </label>
          <label>
            <span>path</span>
            <input type="text" name="path" placeholder="/posts" defaultValue={renderInputValue(filters.path)} />
          </label>
          <label className="admin-audit-filters__toggle">
            <span>Only flagged traffic</span>
            <input type="checkbox" name="onlyFlagged" defaultChecked={filters.onlyFlagged} />
          </label>
          <input type="hidden" name="view" value={view} />
          <div className="admin-audit-filters__actions">
            <button type="submit" className="admin-primary-button">Apply</button>
            <a href="/admin/visits" className="admin-shell__link">Reset</a>
          </div>
        </form>
        <div className="admin-audit-view-toggle" aria-label="Visit display mode">
          <a
            href={buildViewHref(filters, "grouped")}
            className={view === "grouped" ? "admin-audit-view-toggle__link is-active" : "admin-audit-view-toggle__link"}
          >
            Grouped clusters
          </a>
          <a
            href={buildViewHref(filters, "raw")}
            className={view === "raw" ? "admin-audit-view-toggle__link is-active" : "admin-audit-view-toggle__link"}
          >
            Raw timeline
          </a>
        </div>
      </div>

      <div className="admin-page__panel">
        <div className="admin-audit-table-scroll">
          <div className="admin-table admin-panel-table admin-panel-table--visits admin-panel-table--audit">
            <div className="admin-table__head admin-table__head--audit">
              <span>Visited</span>
              <span>Request</span>
              <span>Visitor Context</span>
              <span>Risk &amp; Enforcement</span>
            </div>
            {view === "raw"
              ? rows.map((visit) => renderVisitRow(visit))
              : groupedRows.map((group) => {
                  const [firstVisit, ...remainingVisits] = group.visits;

                  if (group.visits.length === 1) {
                    return renderVisitRow(firstVisit);
                  }

                  return (
                    <details key={group.id} className="admin-audit-group">
                      <summary className="admin-audit-group__summary">
                        <span className="admin-audit-group__summary-copy">
                          <span className="admin-audit-group__summary-title">
                            {group.summary.count} visits in 10 minutes
                          </span>
                          <span className="admin-audit-group__summary-meta">
                            {group.summary.latestTime} → {group.summary.earliestTime}
                          </span>
                          <span className="admin-audit-group__summary-meta">
                            Top path {group.summary.topPath}
                          </span>
                          <span className="admin-audit-group__summary-meta">
                            IP {firstVisit.ipSummary || firstVisit.ipHash || "unknown"} · {firstVisit.deviceSummary?.primary || "未知设备"} · {firstVisit.deviceSummary?.device || "未知设备类型"}
                          </span>
                          <span className="admin-audit-group__summary-meta">
                            {group.summary.riskSummary} · Same IP · Expand timeline
                          </span>
                        </span>
                      </summary>
                      <div className="admin-audit-group__rows">
                        {renderVisitRow(firstVisit)}
                        {remainingVisits.map((visit) => renderVisitRow(visit, { nested: true }))}
                      </div>
                    </details>
                  );
                })}
          </div>
        </div>
      </div>
    </section>
  );
}
