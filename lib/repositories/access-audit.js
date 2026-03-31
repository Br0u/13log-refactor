import { db } from "../db";

const REGION_NAME_MAP = {
  "CA:ONTARIO": "安大略省",
  "CA:ON": "安大略省",
  "CA:QUEBEC": "魁北克省",
  "CA:QC": "魁北克省",
  "CA:BRITISHCOLUMBIA": "不列颠哥伦比亚省",
  "CA:BC": "不列颠哥伦比亚省",
};
const CITY_NAME_MAP = {
  GUELPH: "圭尔夫",
  TORONTO: "多伦多",
  VANCOUVER: "温哥华",
  MONTREAL: "蒙特利尔",
};
const ZH_REGION_NAMES = new Intl.DisplayNames(["zh-CN"], { type: "region" });

function normalizeString(value = "") {
  return String(value || "").trim();
}

function decodeAuditText(value = "") {
  const input = normalizeString(value);
  if (!input) return "";

  let decoded = input;
  if (decoded.includes("%")) {
    try {
      decoded = decodeURIComponent(decoded.replace(/\+/g, "%20"));
    } catch {
      decoded = input;
    }
  }

  if (/[ÃÂâ]/.test(decoded)) {
    const repaired = Buffer.from(decoded, "latin1").toString("utf8");
    if (repaired && !repaired.includes("\uFFFD")) {
      decoded = repaired;
    }
  }

  return decoded
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAuditKey(value = "") {
  return decodeAuditText(value).replace(/[^A-Za-z0-9]/g, "").toUpperCase();
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
  const country = normalizeString(log?.country).toUpperCase();
  const localizedCountry = country
    ? (ZH_REGION_NAMES.of(country) || decodeAuditText(log?.country))
    : "";
  const localizedRegion = REGION_NAME_MAP[`${country}:${normalizeAuditKey(log?.region)}`]
    || decodeAuditText(log?.region);
  const localizedCity = CITY_NAME_MAP[normalizeAuditKey(log?.city)]
    || decodeAuditText(log?.city);

  return [localizedCountry, localizedRegion, localizedCity]
    .map((part) => normalizeString(part))
    .filter(Boolean)
    .join(" / ") || "-";
}

export function formatAuditPath(path = "") {
  return decodeAuditText(path) || "-";
}

export function formatAuditTimestamp(value, timeZone = "UTC") {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "short",
    timeStyle: "medium",
    hour12: false,
    timeZone,
  }).format(date);
}

function extractVersion(userAgent, pattern) {
  const match = String(userAgent || "").match(pattern);
  if (!match?.[1]) return "";

  const parts = match[1].split(".").filter(Boolean);
  const [major, minor] = parts;
  if (!minor || /^0+$/.test(minor)) {
    return major || "";
  }
  return `${major}.${minor}`;
}

export function summarizeAuditUserAgent(userAgent = "") {
  const ua = String(userAgent || "");
  const device = /iPad|Tablet/i.test(ua)
    ? "平板"
    : /Mobile|iPhone|Android/i.test(ua)
      ? "手机"
      : "桌面端";

  let browser = "未知浏览器";
  if (/Edg\//.test(ua)) {
    browser = `Edge ${extractVersion(ua, /Edg\/([\d.]+)/)}`.trim();
  } else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) {
    browser = `Chrome ${extractVersion(ua, /Chrome\/([\d.]+)/)}`.trim();
  } else if (/Firefox\//.test(ua)) {
    browser = `Firefox ${extractVersion(ua, /Firefox\/([\d.]+)/)}`.trim();
  } else if (/Version\/([\d.]+).*Safari\//.test(ua)) {
    browser = `Safari ${extractVersion(ua, /Version\/([\d.]+)/)}`.trim();
  }

  let os = "未知系统";
  if (/Mac OS X/.test(ua)) {
    os = `macOS ${extractVersion(ua.replace(/_/g, "."), /Mac OS X ([\d.]+)/)}`.trim();
  } else if (/iPhone OS|CPU OS/.test(ua)) {
    os = `iOS ${extractVersion(ua.replace(/_/g, "."), /(?:iPhone OS|CPU OS) ([\d.]+)/)}`.trim();
  } else if (/Android/.test(ua)) {
    os = `Android ${extractVersion(ua, /Android ([\d.]+)/)}`.trim();
  } else if (/Windows NT/.test(ua)) {
    const version = extractVersion(ua, /Windows NT ([\d.]+)/);
    os = version ? `Windows ${version}` : "Windows";
  } else if (/Linux/.test(ua)) {
    os = "Linux";
  }

  return { browser, os, device };
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
