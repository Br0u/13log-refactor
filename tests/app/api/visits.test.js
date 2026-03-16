import { beforeEach, describe, expect, it, vi } from "vitest";

const { createVisitLogMock } = vi.hoisted(() => ({
  createVisitLogMock: vi.fn(),
}));

vi.mock("../../../lib/repositories/visit-logs", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createVisitLog: createVisitLogMock,
  };
});

import { POST as visitsPostRoute } from "../../../app/api/visits/route.js";

describe("visits api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores a public page visit with masked ip details", async () => {
    createVisitLogMock.mockResolvedValueOnce({ id: "visit-1" });

    const response = await visitsPostRoute(new Request("http://localhost:3000/api/visits", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.42",
        "x-vercel-ip-country": "Canada",
        "x-vercel-ip-country-region": "Ontario",
        "x-vercel-ip-city": "Guelph",
        "user-agent": "Mozilla/5.0 TestBrowser",
      },
      body: JSON.stringify({
        path: "/posts",
        referer: "https://google.com",
      }),
    }));

    expect(response.status).toBe(201);
    expect(createVisitLogMock).toHaveBeenCalledWith(expect.objectContaining({
      path: "/posts",
      referer: "https://google.com",
      ipSummary: "203.0.113.x",
      country: "Canada",
      region: "Ontario",
      city: "Guelph",
      userAgent: "Mozilla/5.0 TestBrowser",
    }));
  });

  it("ignores admin and api paths", async () => {
    const response = await visitsPostRoute(new Request("http://localhost:3000/api/visits", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        path: "/admin/comments",
        referer: "",
      }),
    }));

    expect(response.status).toBe(204);
    expect(createVisitLogMock).not.toHaveBeenCalled();
  });
});
