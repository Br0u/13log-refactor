import { db } from "../db";

function normalizeString(value = "") {
  return String(value || "").trim();
}

function normalizeBoolean(value) {
  return value === true || value === "true" || value === "on" || value === "1";
}

function parseDateStart(value) {
  const normalized = normalizeString(value);
  if (!normalized) return null;
  const date = new Date(`${normalized}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateEnd(value) {
  const normalized = normalizeString(value);
  if (!normalized) return null;
  const date = new Date(`${normalized}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildCreatedAtClause(from, to) {
  const gte = parseDateStart(from);
  const lte = parseDateEnd(to);
  if (!gte && !lte) return undefined;
  return {
    ...(gte ? { gte } : {}),
    ...(lte ? { lte } : {}),
  };
}

function buildBaseWhere(filters) {
  const where = {};
  const createdAt = buildCreatedAtClause(filters.from, filters.to);
  if (createdAt) {
    where.createdAt = createdAt;
  }

  if (filters.onlyFlagged) {
    where.riskLabel = { in: ["suspicious", "bot"] };
  } else if (filters.riskLabel) {
    where.riskLabel = filters.riskLabel;
  }

  if (filters.blockReason) {
    where.blockReason = filters.blockReason;
  }

  if (filters.country) {
    where.country = filters.country;
  }

  if (filters.path) {
    where.path = {
      contains: filters.path,
      mode: "insensitive",
    };
  }

  return where;
}

function omitCreatedAt(where) {
  const { createdAt, ...rest } = where;
  return rest;
}

export function formatAuditLocation(log) {
  return [log?.country, log?.region, log?.city]
    .map((part) => normalizeString(part))
    .filter(Boolean)
    .join(" / ") || "-";
}

export function buildAccessAuditFilters(searchParams = {}) {
  const source = typeof searchParams?.get === "function"
    ? Object.fromEntries(searchParams.entries())
    : searchParams;

  const filters = {
    from: normalizeString(source?.from),
    to: normalizeString(source?.to),
    riskLabel: normalizeString(source?.riskLabel),
    blockReason: normalizeString(source?.blockReason),
    country: normalizeString(source?.country).toUpperCase(),
    path: normalizeString(source?.path),
    onlyFlagged: normalizeBoolean(source?.onlyFlagged),
  };

  return {
    filters,
    where: buildBaseWhere(filters),
  };
}

export async function getAccessAuditPageData(searchParams = {}) {
  const { filters, where } = buildAccessAuditFilters(searchParams);
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const last7Days = new Date(now);
  last7Days.setDate(last7Days.getDate() - 6);
  last7Days.setHours(0, 0, 0, 0);
  const nonDateWhere = omitCreatedAt(where);

  const [
    todayCount,
    last7DaysCount,
    topPagesRaw,
    normalCount,
    suspiciousCount,
    botCount,
    blockedCount,
    rows,
  ] = await Promise.all([
    db.accessLog.count({
      where: {
        ...nonDateWhere,
        createdAt: { gte: startOfToday },
      },
    }),
    db.accessLog.count({
      where: {
        ...nonDateWhere,
        createdAt: { gte: last7Days },
      },
    }),
    db.accessLog.groupBy({
      by: ["path"],
      where,
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 5,
    }),
    db.accessLog.count({
      where: {
        ...nonDateWhere,
        riskLabel: "normal",
      },
    }),
    db.accessLog.count({
      where: {
        ...nonDateWhere,
        riskLabel: "suspicious",
      },
    }),
    db.accessLog.count({
      where: {
        ...nonDateWhere,
        riskLabel: "bot",
      },
    }),
    db.accessLog.count({
      where: {
        ...nonDateWhere,
        isBlocked: true,
      },
    }),
    db.accessLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const blacklistEntries = rows.length > 0
    ? await db.blacklist.findMany({
      where: {
        ipHash: {
          in: [...new Set(rows.map((row) => row.ipHash))],
        },
      },
    })
    : [];

  const blacklistByHash = new Map(blacklistEntries.map((entry) => [entry.ipHash, entry]));

  return {
    filters,
    summary: {
      todayCount,
      last7DaysCount,
      topPages: topPagesRaw.map((item) => ({
        path: item.path,
        count: item._count.path,
      })),
    },
    riskSummary: {
      normal: normalCount,
      suspicious: suspiciousCount,
      bot: botCount,
      blocked: blockedCount,
    },
    rows: rows.map((row) => ({
      ...row,
      blacklistReason: blacklistByHash.get(row.ipHash)?.reason || null,
    })),
  };
}
