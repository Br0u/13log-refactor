import { db } from "../db";

export type AccessLogInput = {
  ipHash: string;
  ipSummary: string;
  path: string;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  userAgent?: string | null;
  referer?: string | null;
  riskScore: number;
  riskLabel: string;
  isBlocked: boolean;
  blockReason?: string | null;
};

export async function findBlacklistByIpHash(ipHash: string) {
  return db.blacklist.findUnique({
    where: { ipHash },
  });
}

export async function countRecentAccessLogs(ipHash: string, windowSeconds = 10) {
  const threshold = new Date(Date.now() - windowSeconds * 1000);
  return db.accessLog.count({
    where: {
      ipHash,
      createdAt: {
        gte: threshold,
      },
    },
  });
}

export async function createAccessLog(input: AccessLogInput) {
  return db.accessLog.create({
    data: {
      ipHash: input.ipHash,
      ipSummary: input.ipSummary,
      path: input.path,
      country: input.country || null,
      region: input.region || null,
      city: input.city || null,
      userAgent: input.userAgent || null,
      referer: input.referer || null,
      riskScore: input.riskScore,
      riskLabel: input.riskLabel,
      isBlocked: input.isBlocked,
      blockReason: input.blockReason || null,
    },
  });
}

export async function countBotAccessLogs(ipHash: string) {
  return db.accessLog.count({
    where: {
      ipHash,
      riskLabel: "bot",
    },
  });
}

export async function upsertBlacklist(ipHash: string, reason: string, source: string) {
  return db.blacklist.upsert({
    where: { ipHash },
    update: {
      reason,
      source,
    },
    create: {
      ipHash,
      reason,
      source,
    },
  });
}
