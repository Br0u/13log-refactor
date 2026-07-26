import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { middleware } from "../middleware";
import { verifyInternalRiskBody } from "../lib/internal-risk-auth";

const RISK_SECRET = "risk-secret-that-is-at-least-32-characters";
const SESSION_SECRET = "session-secret-that-is-at-least-32-characters";
const INTERNAL_RISK_DEADLINE_MS = 2_000;

describe("risk middleware", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("RISK_INTERNAL_SECRET", RISK_SECRET);
    vi.stubEnv("SESSION_SECRET", SESSION_SECRET);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("skips static assets", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await middleware(new NextRequest("http://localhost:3000/_next/static/chunk.js"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("skips Next.js prefetch requests so PV is not inflated", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await middleware(new NextRequest("http://localhost:3000/admin/visits", {
      headers: {
        purpose: "prefetch",
        "next-router-prefetch": "1",
      },
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("skips App Router flight requests so a page refresh only counts once", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await middleware(new NextRequest("http://localhost:3000/admin/visits?_rsc=abc123", {
      headers: {
        accept: "text/x-component",
      },
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("skips non-document page subrequests so refreshes do not double count page visits", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await middleware(new NextRequest("http://localhost:3000/admin/visits", {
      headers: {
        accept: "*/*",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
      },
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("skips local development requests so local blacklists do not block previews", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({
      action: "block",
      status: 403,
      reason: "blacklist",
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));

    const response = await middleware(new NextRequest("http://localhost:3001/"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("allows normal requests after internal evaluation", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({
      action: "allow",
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));

    const request = new NextRequest("http://localhost:3000/posts", {
      headers: {
        referer: "https://example.com",
        "user-agent": "Mozilla/5.0 Chrome/141.0.0.0 Safari/537.36",
        "x-forwarded-for": "203.0.113.10",
        "x-vercel-ip-country": "CA",
        "x-vercel-ip-country-region": "Ontario",
        "x-vercel-ip-city": "Guelph",
      },
    });

    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [, init] = fetchSpy.mock.calls[0];
    const body = String(init?.body);
    const headers = new Headers(init?.headers);
    const payload = JSON.parse(body);
    await expect(verifyInternalRiskBody(
      body,
      headers.get("x-risk-timestamp"),
      headers.get("x-risk-signature"),
      Number(headers.get("x-risk-timestamp")),
    )).resolves.toBe(true);
    expect(headers.has("x-risk-internal")).toBe(false);
    expect(payload.path).toBe("/posts");
    expect(payload.country).toBe("CA");
    expect(payload.riskScore).toBe(0);
    expect(payload.riskLabel).toBe("normal");
    expect(payload.ipHash).toMatch(/^[a-f0-9]{64}$/);
    expect(payload.ipSummary).toBe("203.0.113.x");
  });

  it("blocks bot traffic with 403", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({
      action: "block",
      status: 403,
      reason: "bot",
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));

    const request = new NextRequest("http://localhost:3000/admin", {
      headers: {
        "user-agent": "Mozilla/5.0 Chrome/142.0.0.0 Safari/537.36",
        "x-forwarded-for": "203.0.113.99",
        "x-vercel-ip-country": "CN",
      },
    });

    const response = await middleware(request);

    expect(response.status).toBe(403);
  });

  it("blocks rate limited traffic with 429", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({
      action: "block",
      status: 429,
      reason: "rate_limit",
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));

    const request = new NextRequest("http://localhost:3000/api/comments", {
      method: "POST",
      headers: {
        referer: "https://example.com",
        "user-agent": "Mozilla/5.0 Chrome/141.0.0.0 Safari/537.36",
        "x-forwarded-for": "203.0.113.100",
        "x-vercel-ip-country": "CA",
        "x-vercel-ip-country-region": "Ontario",
        "x-vercel-ip-city": "Guelph",
      },
    });

    const response = await middleware(request);

    expect(response.status).toBe(429);
  });

  it("fails open when the internal risk fetch rejects", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network unavailable"));

    const response = await middleware(new NextRequest("http://localhost:3000/posts"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("fails open when the internal risk service returns a non-2xx response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("forbidden", {
      status: 403,
    }));

    const response = await middleware(new NextRequest("http://localhost:3000/posts"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("fails open when the internal risk response is not valid JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("not-json", {
      status: 200,
    }));

    const response = await middleware(new NextRequest("http://localhost:3000/posts"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it.each([
    ["block with an out-of-range status", { action: "block", status: 999 }],
    ["block without a status", { action: "block" }],
    ["an unknown action", { action: "deny", status: 403 }],
  ])("fails open for a 2xx decision containing %s", async (_label, decision) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(
      JSON.stringify(decision),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    ));

    const response = await middleware(new NextRequest("http://localhost:3000/posts"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("aborts a hanging internal risk request and fails open at the deadline", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementationOnce((
      _input,
      init,
    ) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new DOMException("The operation was aborted", "AbortError"));
      }, { once: true });
    }));

    const responsePromise = middleware(new NextRequest("http://localhost:3000/posts"));
    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
    const [, init] = fetchSpy.mock.calls[0];
    expect(init?.signal).toBeInstanceOf(AbortSignal);

    await vi.advanceTimersByTimeAsync(INTERNAL_RISK_DEADLINE_MS);
    const response = await responsePromise;

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    ["missing", undefined, SESSION_SECRET],
    ["short", "too-short", SESSION_SECRET],
    ["same as SESSION_SECRET", SESSION_SECRET, SESSION_SECRET],
  ])("fails open without fetching when RISK_INTERNAL_SECRET is %s", async (
    _label,
    riskSecret,
    sessionSecret,
  ) => {
    vi.stubEnv("RISK_INTERNAL_SECRET", riskSecret);
    vi.stubEnv("SESSION_SECRET", sessionSecret);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(
      JSON.stringify({ action: "block", status: 403 }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    ));

    const response = await middleware(new NextRequest("http://localhost:3000/posts"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
