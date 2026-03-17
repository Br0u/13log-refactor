import React from "react";
import { formatVisitLocation, getVisitLogSummary, listRecentVisitLogs } from "../../../../lib/repositories/visit-logs";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Visits | 13log Admin",
};

export default async function AdminVisitsPage() {
  const [summary, visits] = await Promise.all([
    getVisitLogSummary(),
    listRecentVisitLogs(),
  ]);

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Traffic</p>
          <h1>Visits</h1>
          <p className="admin-page-copy">轻量查看公开页面访问时间、来源和地理位置信息。</p>
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
          <p>{summary.topPages.map((item) => `${item.path} (${item.count})`).join(" · ") || "No visits yet."}</p>
        </article>
      </section>

      <div className="admin-page__panel">
        <div className="admin-table admin-panel-table admin-panel-table--visits">
          <div className="admin-table__head admin-table__head--visits">
            <span>Visited</span>
            <span>Path</span>
            <span>Referer</span>
            <span>Location</span>
          </div>
          {visits.map((visit) => (
            <div key={visit.id} className="admin-table__row admin-table__row--visits">
              <span>{new Date(visit.createdAt).toLocaleString("zh-CN")}</span>
              <span className="admin-table__content-cell">{visit.path}</span>
              <span className="admin-table__content-cell">{visit.referer || "-"}</span>
              <span className="admin-table__content-cell">{formatVisitLocation(visit)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
