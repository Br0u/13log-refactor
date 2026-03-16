import { createVisitLog, maskIpAddress, shouldTrackVisitPath } from "../../../lib/repositories/visit-logs";

function getRequestIp(headers) {
  return headers.get("cf-connecting-ip")
    || headers.get("x-forwarded-for")
    || headers.get("x-real-ip")
    || "";
}

function getGeo(headers) {
  return {
    country: headers.get("x-vercel-ip-country") || headers.get("cf-ipcountry") || "",
    region: headers.get("x-vercel-ip-country-region") || headers.get("x-vercel-ip-region") || "",
    city: headers.get("x-vercel-ip-city") || headers.get("x-vercel-ip-city-region") || "",
  };
}

export async function POST(request) {
  const body = await request.json();
  const path = String(body?.path || "").trim();

  if (!shouldTrackVisitPath(path)) {
    return new Response(null, { status: 204 });
  }

  const geo = getGeo(request.headers);

  await createVisitLog({
    path,
    referer: String(body?.referer || "").trim(),
    ipSummary: maskIpAddress(getRequestIp(request.headers)),
    country: geo.country,
    region: geo.region,
    city: geo.city,
    userAgent: request.headers.get("user-agent") || "",
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: {
      "content-type": "application/json",
    },
  });
}
