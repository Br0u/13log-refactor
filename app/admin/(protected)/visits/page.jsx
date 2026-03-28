import React from "react";
import { formatAuditLocation, getAccessAuditPageData } from "../../../../lib/repositories/access-audit";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Visits | 13log Admin",
};

function renderTopPages(summary) {
  return summary.topPages.map((item) => `${item.path} (${item.count})`).join(" · ") || "No visits yet.";
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

export default async function AdminVisitsPage({ searchParams }) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const { filters, summary, riskSummary, rows } = await getAccessAuditPageData(resolvedSearchParams);

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
          <p className="admin-overview-card__label">Top Pages</p>
          <h2>{summary.topPages[0]?.path || "-"}</h2>
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
          <div className="admin-audit-filters__actions">
            <button type="submit" className="admin-primary-button">Apply</button>
            <a href="/admin/visits" className="admin-shell__link">Reset</a>
          </div>
        </form>
      </div>

      <div className="admin-page__panel">
        <div className="admin-audit-table-scroll">
          <div className="admin-table admin-panel-table admin-panel-table--visits admin-panel-table--audit">
          <div className="admin-table__head admin-table__head--audit">
            <span>Visited</span>
            <span>Path</span>
            <span>Location</span>
            <span>Risk Label</span>
            <span>Risk Score</span>
            <span>Block Reason</span>
            <span>Referer</span>
            <span>User Agent</span>
            <span>Blacklist</span>
          </div>
          {rows.map((visit) => (
            <div key={visit.id} className="admin-table__row admin-table__row--audit">
              <span>{new Date(visit.createdAt).toLocaleString("zh-CN")}</span>
              <span
                className="admin-table__content-cell admin-audit-cell--truncate admin-audit-cell--path"
                title={visit.path}
              >
                {visit.path}
              </span>
              <span
                className="admin-table__content-cell admin-audit-cell--truncate admin-audit-cell--location"
                title={formatAuditLocation(visit)}
              >
                {formatAuditLocation(visit)}
              </span>
              <span className="admin-table__content-cell">
                {renderBadge(
                  visit.riskLabel,
                  visit.riskLabel === "bot"
                    ? "danger"
                    : visit.riskLabel === "suspicious"
                      ? "warn"
                      : "neutral",
                )}
              </span>
              <span>{visit.riskScore}</span>
              <span className="admin-table__content-cell">
                {renderBadge(visit.blockReason || "-", visit.blockReason ? "danger" : "neutral")}
              </span>
              <span
                className="admin-table__content-cell admin-audit-cell--truncate admin-audit-cell--referer"
                title={visit.referer || "-"}
              >
                {visit.referer || "-"}
              </span>
              <span
                className="admin-table__content-cell admin-audit-cell--truncate admin-audit-cell--user-agent"
                title={visit.userAgent || "-"}
              >
                {visit.userAgent || "-"}
              </span>
              <span className="admin-table__content-cell">
                {renderBadge(visit.blacklistReason || "-", visit.blacklistReason ? "danger" : "neutral")}
              </span>
            </div>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}
