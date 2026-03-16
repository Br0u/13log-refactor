import { Prisma } from "@prisma/client";
import { db } from "../db";

const STATIC_FILE_RE = /\.(?:css|js|mjs|map|png|jpg|jpeg|gif|svg|ico|webp|avif|txt|xml|json|woff2?)$/i;

function isMissingColumnError(error, columnName) {
  return error instanceof Prisma.PrismaClientKnownRequestError
    && error.code === "P2022"
    && String(error.meta?.column || "").includes(columnName);
}

export function shouldTrackVisitPath(path = "") {
  const value = String(path || "").trim();
  if (!value || !value.startsWith("/")) return false;
  if (value.startsWith("/admin")) return false;
  if (value.startsWith("/api")) return false;
  if (value.startsWith("/_next")) return false;
  if (STATIC_FILE_RE.test(value)) return false;
  return true;
}

export function maskIpAddress(value = "") {
  const raw = String(value || "").split(",")[0].trim();
  if (!raw) return "unknown";

  if (raw.includes(":")) {
    const parts = raw.split(":").filter(Boolean);
    if (parts.length < 2) return "ipv6";
    return `${parts.slice(0, 2).join(":")}::*`;
  }

  const parts = raw.split(".");
  if (parts.length !== 4) return "unknown";
  return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
}

export async function createVisitLog(input) {
  const baseData = {
    path: input.path,
    referer: input.referer || null,
    ipSummary: input.ipSummary,
    userAgent: input.userAgent || null,
  };

  try {
    return await db.visitLog.create({
      data: {
        ...baseData,
        country: input.country || null,
        region: input.region || null,
        city: input.city || null,
      },
    });
  } catch (error) {
    if (isMissingColumnError(error, "VisitLog.country")) {
      return db.visitLog.create({
        data: baseData,
      });
    }
    throw error;
  }
}

export function formatVisitLocation(visit) {
  const parts = [visit?.country, visit?.region, visit?.city]
    .map((part) => String(part || "").trim())
    .filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" / ");
  }

  return visit?.ipSummary || "unknown";
}

export async function listRecentVisitLogs(limit = 100) {
  try {
    return await db.visitLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    if (isMissingColumnError(error, "VisitLog.country")) {
      const visits = await db.visitLog.findMany({
        select: {
          id: true,
          path: true,
          referer: true,
          ipSummary: true,
          userAgent: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return visits.map((visit) => ({
        ...visit,
        country: null,
        region: null,
        city: null,
      }));
    }
    throw error;
  }
}

export async function getVisitLogSummary() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const last7Days = new Date(now);
  last7Days.setDate(last7Days.getDate() - 6);
  last7Days.setHours(0, 0, 0, 0);

  const [todayCount, last7DaysCount, topPagesRaw] = await Promise.all([
    db.visitLog.count({
      where: {
        createdAt: { gte: startOfToday },
      },
    }),
    db.visitLog.count({
      where: {
        createdAt: { gte: last7Days },
      },
    }),
    db.visitLog.groupBy({
      by: ["path"],
      _count: {
        path: true,
      },
      orderBy: {
        _count: {
          path: "desc",
        },
      },
      take: 5,
    }),
  ]);

  return {
    todayCount,
    last7DaysCount,
    topPages: topPagesRaw.map((item) => ({
      path: item.path,
      count: item._count.path,
    })),
  };
}
