import type { NextRequest } from "next/server";

export type RiskLabel = "normal" | "suspicious" | "bot";

export type RiskAssessmentInput = {
  country?: string | null;
  region?: string | null;
  city?: string | null;
  userAgent?: string | null;
  referer?: string | null;
  isDataCenter?: boolean;
};

export type RiskAssessment = {
  riskScore: number;
  riskLabel: RiskLabel;
};

export function summarizeIpAddress(ipAddress: string) {
  const raw = normalizeValue(ipAddress).split(",")[0].trim();
  if (!raw) return "unknown";

  if (raw.includes(":")) {
    const segments = raw.split(":").filter(Boolean);
    return `${segments.slice(0, 2).join(":") || raw}::*`;
  }

  const parts = raw.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
  }

  return raw;
}

const STATIC_FILE_RE = /\.(?:css|js|mjs|map|png|jpg|jpeg|gif|svg|ico|webp|avif|txt|xml|json|woff2?)$/i;
const STATIC_PATHS = new Set(["/favicon.ico", "/robots.txt", "/sitemap.xml"]);
const DATA_CENTER_MARKERS = [
  "aws",
  "amazon",
  "google cloud",
  "gcp",
  "azure",
  "digitalocean",
  "linode",
  "vultr",
  "oracle cloud",
  "data center",
  "datacenter",
];

const AUTOMATION_USER_AGENT_RE = /(bot|crawler|spider|scrapy|curl|wget|python-requests|python-urllib|aiohttp|httpclient|go-http-client|okhttp|postmanruntime|insomnia|libwww-perl|apache-httpclient|java\/|node-fetch|undici)/i;
const BROWSER_USER_AGENT_RE = /(mozilla\/5\.0|chrome\/|safari\/|firefox\/|edg\/|version\/)/i;

function normalizeValue(value?: string | null) {
  return String(value || "").trim();
}

export function isProtectedPath(pathname = "") {
  if (!pathname.startsWith("/")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname === "/api/internal/risk") return false;
  if (pathname === "/admin/login") return false;
  if (pathname === "/api/admin/login") return false;
  if (STATIC_PATHS.has(pathname)) return false;
  if (STATIC_FILE_RE.test(pathname)) return false;
  return true;
}

export function shouldSkipRiskEvaluation(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const purpose = normalizeValue(request.headers.get("purpose")).toLowerCase();
  const secPurpose = normalizeValue(request.headers.get("sec-purpose")).toLowerCase();
  const secFetchDest = normalizeValue(request.headers.get("sec-fetch-dest")).toLowerCase();
  const secFetchMode = normalizeValue(request.headers.get("sec-fetch-mode")).toLowerCase();
  const accept = normalizeValue(request.headers.get("accept")).toLowerCase();

  if (!pathname.startsWith("/api/")) {
    if (request.method !== "GET") {
      return true;
    }

    if (secFetchDest && secFetchDest !== "document") {
      return true;
    }

    if (secFetchMode && secFetchMode !== "navigate") {
      return true;
    }
  }

  return Boolean(
    request.nextUrl.searchParams.get("_rsc")
      || request.headers.get("next-router-prefetch")
      || request.headers.get("x-middleware-prefetch")
      || request.headers.get("rsc")
      || request.headers.get("x-nextjs-data")
      || purpose === "prefetch"
      || secPurpose === "prefetch"
      || accept.includes("text/x-component"),
  );
}

export function computeRiskAssessment(input: RiskAssessmentInput): RiskAssessment {
  let riskScore = 0;

  const userAgent = normalizeValue(input.userAgent);
  const referer = normalizeValue(input.referer);
  const country = normalizeValue(input.country);
  const region = normalizeValue(input.region);
  const city = normalizeValue(input.city);

  const hasBrowserLikeUserAgent = BROWSER_USER_AGENT_RE.test(userAgent);
  const hasAutomationUserAgent = AUTOMATION_USER_AGENT_RE.test(userAgent);
  const hasPreciseGeo = Boolean(region && city);
  const hasAnyGeo = Boolean(country || region || city);

  if (!userAgent) {
    riskScore += 35;
  } else if (hasAutomationUserAgent) {
    riskScore += 55;
  } else if (!hasBrowserLikeUserAgent) {
    riskScore += 20;
  }

  if (input.isDataCenter) {
    riskScore += 25;
  }

  if (!hasPreciseGeo) {
    riskScore += hasAnyGeo ? 5 : 10;
  }

  if (!referer) {
    riskScore += 5;
  }

  if (input.isDataCenter && hasAutomationUserAgent) {
    riskScore += 20;
  }

  if (riskScore >= 70) {
    return { riskScore, riskLabel: "bot" };
  }

  if (riskScore >= 30) {
    return { riskScore, riskLabel: "suspicious" };
  }

  return { riskScore, riskLabel: "normal" };
}

export function getClientIp(request: NextRequest) {
  return request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")
    || request.headers.get("x-real-ip")
    || "";
}

export async function hashIpAddress(ipAddress: string) {
  const raw = normalizeValue(ipAddress).split(",")[0].trim() || "unknown";
  const payload = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export function getRequestGeo(request: NextRequest) {
  const requestWithGeo = request as NextRequest & {
    geo?: {
      country?: string;
      region?: string;
      city?: string;
    };
  };

  return {
    country: normalizeValue(
      requestWithGeo.geo?.country
        || request.headers.get("x-vercel-ip-country")
        || request.headers.get("cf-ipcountry"),
    ),
    region: normalizeValue(
      requestWithGeo.geo?.region
        || request.headers.get("x-vercel-ip-country-region")
        || request.headers.get("x-vercel-ip-region"),
    ),
    city: normalizeValue(
      requestWithGeo.geo?.city
        || request.headers.get("x-vercel-ip-city")
        || request.headers.get("x-vercel-ip-city-region"),
    ),
  };
}

export function isDataCenterRequest(request: NextRequest) {
  const providerHint = [
    request.headers.get("x-risk-ip-provider"),
    request.headers.get("x-vercel-ip-org"),
    request.headers.get("x-vercel-ip-as-organization"),
  ]
    .map((value) => normalizeValue(value).toLowerCase())
    .filter(Boolean)
    .join(" ");

  return DATA_CENTER_MARKERS.some((marker) => providerHint.includes(marker));
}
