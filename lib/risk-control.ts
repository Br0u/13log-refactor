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

  if (normalizeValue(input.country).toUpperCase() === "CN") {
    riskScore += 40;
  }

  if (!normalizeValue(input.referer)) {
    riskScore += 20;
  }

  if (normalizeValue(input.userAgent).includes("Chrome/142")) {
    riskScore += 20;
  }

  if (!normalizeValue(input.region) || !normalizeValue(input.city)) {
    riskScore += 10;
  }

  if (input.isDataCenter) {
    riskScore += 20;
  }

  if (riskScore >= 70) {
    return { riskScore, riskLabel: "bot" };
  }

  if (riskScore >= 40) {
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
