import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, type NextFetchEvent } from "next/server";

import { middleware } from "../middleware";
import { verifyInternalRiskBody } from "../lib/internal-risk-auth";

const RISK_SECRET = "risk-secret-that-is-at-least-32-characters";
const SESSION_SECRET = "session-secret-that-is-at-least-32-characters";
const INTERNAL_RISK_DEADLINE_MS = 2_000;

function createWaitUntilEvent() {
  const tasks: Promise<unknown>[] = [];
  const waitUntil = vi.fn((task: Promise<unknown>) => {
    tasks.push(task);
  });

  return {
    event: { waitUntil } as unknown as NextFetchEvent,
    tasks,
    waitUntil,
  };
}

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
    const { event, waitUntil } = createWaitUntilEvent();

    const response = await middleware(new NextRequest("http://localhost:3000/_next/static/chunk.js"), event);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it("skips Next.js prefetch requests so PV is not inflated", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { event, waitUntil } = createWaitUntilEvent();

    const response = await middleware(new NextRequest("http://localhost:3000/posts", {
      headers: {
        purpose: "prefetch",
        "next-router-prefetch": "1",
      },
    }), event);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it("skips App Router flight requests so a page refresh only counts once", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { event, waitUntil } = createWaitUntilEvent();

    const response = await middleware(new NextRequest("http://localhost:3000/posts?_rsc=abc123", {
      headers: {
        accept: "text/x-component",
      },
    }), event);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it("skips non-document page subrequests so refreshes do not double count page visits", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { event, waitUntil } = createWaitUntilEvent();

    const response = await middleware(new NextRequest("http://localhost:3000/posts", {
      headers: {
        accept: "*/*",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
      },
    }), event);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
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
    const { event, waitUntil } = createWaitUntilEvent();

    const response = await middleware(new NextRequest("http://localhost:3001/"), event);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it("does not schedule public non-GET requests", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { event, waitUntil } = createWaitUntilEvent();

    const response = await middleware(new NextRequest("http://localhost:3000/posts", {
      method: "POST",
    }), event);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it("schedules public document telemetry as a log-only task without waiting for it", async () => {
    let resolveFetch = (_response: Response) => {};
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementationOnce(() => new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    }));
    const { event, tasks, waitUntil } = createWaitUntilEvent();

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

    const response = await middleware(request, event);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(waitUntil).toHaveBeenCalledTimes(1);
    expect(tasks).toHaveLength(1);
    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

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
    expect(payload.mode).toBe("log-only");

    resolveFetch(new Response(JSON.stringify({ action: "allow" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
    await expect(tasks[0]).resolves.toBeUndefined();
  });

  it("does not launch public document telemetry when a waitUntil event is unavailable", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({
      action: "block",
      status: 403,
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));

    const response = await middleware(new NextRequest("http://localhost:3000/posts"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not start untracked public telemetry when waitUntil throws", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("unexpected fetch"));
    const waitUntil = vi.fn((_task: Promise<unknown>) => {
      throw new Error("waitUntil unavailable");
    });
    const event = { waitUntil } as unknown as NextFetchEvent;

    const response = await middleware(new NextRequest("http://localhost:3000/posts"), event);
    await Promise.resolve();
    await Promise.resolve();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(waitUntil).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("allows normal protected requests after internal evaluation", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({
      action: "allow",
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));

    const request = new NextRequest("http://localhost:3000/admin/visits", {
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
    expect(payload.path).toBe("/admin/visits");
    expect(payload.mode).toBeUndefined();
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

  it("contains rejected public telemetry in the waitUntil task", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network unavailable"));
    const { event, tasks, waitUntil } = createWaitUntilEvent();

    const response = await middleware(new NextRequest("http://localhost:3000/posts"), event);

    expect(response.status).toBe(200);
    expect(waitUntil).toHaveBeenCalledTimes(1);
    await expect(tasks[0]).resolves.toBeUndefined();
  });

  it.each([
    ["a non-2xx response", new Response("forbidden", { status: 403 })],
    ["a malformed response", new Response("not-json", { status: 200 })],
  ])("contains public telemetry with %s in the waitUntil task", async (_label, riskResponse) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(riskResponse);
    const { event, tasks, waitUntil } = createWaitUntilEvent();

    const response = await middleware(new NextRequest("http://localhost:3000/posts"), event);

    expect(response.status).toBe(200);
    expect(waitUntil).toHaveBeenCalledTimes(1);
    await expect(tasks[0]).resolves.toBeUndefined();
  });

  it("serves a public document even if background telemetry reports a block", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({
      action: "block",
      status: 403,
      reason: "bot",
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
    const { event, tasks, waitUntil } = createWaitUntilEvent();

    const response = await middleware(new NextRequest("http://localhost:3000/posts"), event);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(waitUntil).toHaveBeenCalledTimes(1);
    await expect(tasks[0]).resolves.toBeUndefined();
  });

  it("contains public telemetry secret configuration failures in the waitUntil task", async () => {
    vi.stubEnv("RISK_INTERNAL_SECRET", "too-short");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { event, tasks, waitUntil } = createWaitUntilEvent();

    const response = await middleware(new NextRequest("http://localhost:3000/posts"), event);

    expect(response.status).toBe(200);
    expect(waitUntil).toHaveBeenCalledTimes(1);
    await expect(tasks[0]).resolves.toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("contains a public telemetry deadline abort and clears its timer", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementationOnce((
      _input,
      init,
    ) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new DOMException("The operation was aborted", "AbortError"));
      }, { once: true });
    }));
    const { event, tasks, waitUntil } = createWaitUntilEvent();

    const response = await middleware(new NextRequest("http://localhost:3000/posts"), event);

    expect(response.status).toBe(200);
    expect(waitUntil).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
    const [, init] = fetchSpy.mock.calls[0];
    expect(init?.signal).toBeInstanceOf(AbortSignal);

    await vi.advanceTimersByTimeAsync(INTERNAL_RISK_DEADLINE_MS);
    await expect(tasks[0]).resolves.toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("fails open when the synchronous internal risk fetch rejects", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network unavailable"));

    const response = await middleware(new NextRequest("http://localhost:3000/admin/visits"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("fails open when the synchronous internal risk service returns a non-2xx response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("forbidden", {
      status: 403,
    }));

    const response = await middleware(new NextRequest("http://localhost:3000/admin/visits"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("fails open when the synchronous internal risk response is not valid JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("not-json", {
      status: 200,
    }));

    const response = await middleware(new NextRequest("http://localhost:3000/admin/visits"));

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

    const response = await middleware(new NextRequest("http://localhost:3000/admin/visits"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("aborts a hanging synchronous internal risk request and fails open at the deadline", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementationOnce((
      _input,
      init,
    ) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new DOMException("The operation was aborted", "AbortError"));
      }, { once: true });
    }));

    const responsePromise = middleware(new NextRequest("http://localhost:3000/admin/visits"));
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

    const response = await middleware(new NextRequest("http://localhost:3000/admin/visits"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
