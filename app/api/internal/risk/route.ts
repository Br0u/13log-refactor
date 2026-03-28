import { z } from "zod";

import {
  countBotAccessLogs,
  countRecentAccessLogs,
  createAccessLog,
  findBlacklistByIpHash,
  upsertBlacklist,
} from "../../../../lib/repositories/access-logs";

export const runtime = "nodejs";

const riskPayloadSchema = z.object({
  ipHash: z.string().min(1),
  path: z.string().min(1),
  country: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  referer: z.string().optional().nullable(),
  riskScore: z.number().int().nonnegative(),
  riskLabel: z.enum(["normal", "suspicious", "bot"]),
  method: z.string().optional(),
});

const RATE_LIMIT_WINDOW_SECONDS = 10;
const RATE_LIMIT_MAX_REQUESTS = 20;

function shouldApplyRateLimit(pathname: string) {
  return pathname.startsWith("/api/");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

export async function POST(request: Request) {
  if (request.headers.get("x-risk-internal") !== "1") {
    return json({ error: "forbidden" }, 403);
  }

  const payload = riskPayloadSchema.parse(await request.json());

  const baseLog = {
    ipHash: payload.ipHash,
    path: payload.path,
    country: payload.country || null,
    region: payload.region || null,
    city: payload.city || null,
    userAgent: payload.userAgent || null,
    referer: payload.referer || null,
    riskScore: payload.riskScore,
    riskLabel: payload.riskLabel,
  };

  const blacklistEntry = await findBlacklistByIpHash(payload.ipHash);
  if (blacklistEntry) {
    await createAccessLog({
      ...baseLog,
      isBlocked: true,
      blockReason: "blacklist",
    });

    return json({
      action: "block",
      status: 403,
      reason: "blacklist",
    });
  }

  if (shouldApplyRateLimit(payload.path)) {
    const recentCount = await countRecentAccessLogs(payload.ipHash, RATE_LIMIT_WINDOW_SECONDS);
    if (recentCount >= RATE_LIMIT_MAX_REQUESTS) {
      await createAccessLog({
        ...baseLog,
        isBlocked: true,
        blockReason: "rate_limit",
      });

      return json({
        action: "block",
        status: 429,
        reason: "rate_limit",
      });
    }
  }

  if (payload.riskScore >= 70 || payload.riskLabel === "bot") {
    await createAccessLog({
      ...baseLog,
      isBlocked: true,
      blockReason: "bot",
    });

    const botCount = await countBotAccessLogs(payload.ipHash);
    if (botCount >= 3) {
      await upsertBlacklist(payload.ipHash, "bot_threshold", "risk_control");
    }

    return json({
      action: "block",
      status: 403,
      reason: "bot",
    });
  }

  await createAccessLog({
    ...baseLog,
    isBlocked: false,
    blockReason: null,
  });

  return json({
    action: "allow",
    status: 200,
    reason: "logged",
  });
}
