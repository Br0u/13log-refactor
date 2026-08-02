import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { signInternalRiskBody } from "./lib/internal-risk-auth";
import {
  computeRiskAssessment,
  getClientIp,
  getRequestGeo,
  hashIpAddress,
  isDataCenterRequest,
  isProtectedPath,
  shouldSkipRiskEvaluation,
  summarizeIpAddress,
} from "./lib/risk-control";

type RiskApiDecision =
  | { action: "allow" }
  | { action: "block"; status: 403 | 429 };

const INTERNAL_RISK_DEADLINE_MS = 2_000;

type RiskPayloadMode = "log-only";

function normalizeRiskApiDecision(value: unknown): RiskApiDecision {
  if (
    typeof value === "object"
    && value !== null
    && "action" in value
    && value.action === "block"
    && "status" in value
    && (value.status === 403 || value.status === 429)
  ) {
    return {
      action: "block",
      status: value.status,
    };
  }

  return { action: "allow" };
}

function isLocalDevelopmentRequest(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(request.nextUrl.hostname);
}

async function evaluateRisk(
  request: NextRequest,
  mode?: RiskPayloadMode,
): Promise<RiskApiDecision> {
  const geo = getRequestGeo(request);
  const referer = request.headers.get("referer") || "";
  const userAgent = request.headers.get("user-agent") || "";
  const clientIp = getClientIp(request);
  const ipHash = await hashIpAddress(clientIp);
  const ipSummary = summarizeIpAddress(clientIp);
  const assessment = computeRiskAssessment({
    ...geo,
    referer,
    userAgent,
    isDataCenter: isDataCenterRequest(request),
  });

  const body = JSON.stringify({
    ipHash,
    ipSummary,
    path: request.nextUrl.pathname,
    country: geo.country,
    region: geo.region,
    city: geo.city,
    userAgent,
    referer,
    riskScore: assessment.riskScore,
    riskLabel: assessment.riskLabel,
    method: request.method,
    ...(mode ? { mode } : {}),
  });
  const signed = await signInternalRiskBody(body, Date.now());
  const controller = new AbortController();
  const deadline = setTimeout(() => {
    controller.abort();
  }, INTERNAL_RISK_DEADLINE_MS);

  try {
    const response = await fetch(new URL("/api/internal/risk", request.url), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-risk-timestamp": signed.timestamp,
        "x-risk-signature": signed.signature,
      },
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      return { action: "allow" };
    }

    return normalizeRiskApiDecision(await response.json());
  } finally {
    clearTimeout(deadline);
  }
}

function isSynchronousEnforcementPath(pathname: string) {
  return pathname === "/admin"
    || pathname.startsWith("/admin/")
    || pathname === "/api"
    || pathname.startsWith("/api/");
}

function schedulePublicRiskLog(request: NextRequest, event?: NextFetchEvent) {
  if (!event || typeof event.waitUntil !== "function") {
    return;
  }

  let isTracked = false;
  const task = Promise.resolve().then(async () => {
    if (!isTracked) {
      return;
    }

    try {
      await evaluateRisk(request, "log-only");
    } catch {
      // Public telemetry must never reject the waitUntil task or block navigation.
    }
  });

  try {
    event.waitUntil(task);
    isTracked = true;
  } catch {
    // Do not start an untracked telemetry task when waitUntil is unavailable.
  }
}

export async function middleware(request: NextRequest, event?: NextFetchEvent) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (isLocalDevelopmentRequest(request)) {
    return NextResponse.next();
  }

  if (shouldSkipRiskEvaluation(request)) {
    return NextResponse.next();
  }

  if (!isSynchronousEnforcementPath(request.nextUrl.pathname)) {
    schedulePublicRiskLog(request, event);
    return NextResponse.next();
  }

  let decision: RiskApiDecision;
  try {
    decision = await evaluateRisk(request);
  } catch {
    return NextResponse.next();
  }
  if (decision.action === "block") {
    return new NextResponse("Forbidden", {
      status: decision.status,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
