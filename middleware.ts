import { NextResponse, type NextRequest } from "next/server";

import {
  computeRiskAssessment,
  getClientIp,
  getRequestGeo,
  hashIpAddress,
  isDataCenterRequest,
  isProtectedPath,
} from "./lib/risk-control";

type RiskApiDecision = {
  action?: "allow" | "block";
  status?: number;
};

async function evaluateRisk(request: NextRequest) {
  const geo = getRequestGeo(request);
  const referer = request.headers.get("referer") || "";
  const userAgent = request.headers.get("user-agent") || "";
  const ipHash = await hashIpAddress(getClientIp(request));
  const assessment = computeRiskAssessment({
    ...geo,
    referer,
    userAgent,
    isDataCenter: isDataCenterRequest(request),
  });

  const response = await fetch(new URL("/api/internal/risk", request.url), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-risk-internal": "1",
    },
    body: JSON.stringify({
      ipHash,
      path: request.nextUrl.pathname,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      userAgent,
      referer,
      riskScore: assessment.riskScore,
      riskLabel: assessment.riskLabel,
      method: request.method,
    }),
  });

  if (!response.ok) {
    return { action: "allow" } satisfies RiskApiDecision;
  }

  const decision = await response.json() as RiskApiDecision;
  return {
    action: decision.action || "allow",
    status: decision.status,
  };
}

export async function middleware(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const decision = await evaluateRisk(request);
  if (decision.action === "block") {
    return new NextResponse("Forbidden", {
      status: decision.status || 403,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
