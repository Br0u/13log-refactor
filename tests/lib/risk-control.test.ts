import { describe, expect, it } from "vitest";

import { computeRiskAssessment, isProtectedPath } from "../../lib/risk-control";

describe("risk control", () => {
  it("scores obvious automation from a data center as bot", () => {
    const assessment = computeRiskAssessment({
      country: "CN",
      region: "",
      city: "",
      userAgent: "python-requests/2.32.3",
      referer: "",
      isDataCenter: true,
    });

    expect(assessment.riskScore).toBeGreaterThanOrEqual(70);
    expect(assessment.riskLabel).toBe("bot");
  });

  it("marks data center traffic with weak trust signals as suspicious instead of auto-blocking", () => {
    const assessment = computeRiskAssessment({
      country: "CA",
      region: "",
      city: "",
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36",
      referer: "",
      isDataCenter: true,
    });

    expect(assessment.riskScore).toBeGreaterThanOrEqual(30);
    expect(assessment.riskScore).toBeLessThan(70);
    expect(assessment.riskLabel).toBe("suspicious");
  });

  it("keeps direct browser traffic normal even without a referer", () => {
    const assessment = computeRiskAssessment({
      country: "CA",
      region: "Ontario",
      city: "Guelph",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36",
      referer: "",
      isDataCenter: false,
    });

    expect(assessment.riskScore).toBeLessThan(30);
    expect(assessment.riskLabel).toBe("normal");
  });

  it("does not treat country alone as a bot signal", () => {
    const assessment = computeRiskAssessment({
      country: "CN",
      region: "Guangdong",
      city: "Shenzhen",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
      referer: "https://example.com",
      isDataCenter: false,
    });

    expect(assessment.riskScore).toBeLessThan(30);
    expect(assessment.riskLabel).toBe("normal");
  });

  it("protects business routes and skips static assets", () => {
    expect(isProtectedPath("/posts")).toBe(true);
    expect(isProtectedPath("/api/comments")).toBe(true);
    expect(isProtectedPath("/admin")).toBe(true);
    expect(isProtectedPath("/admin/login")).toBe(false);
    expect(isProtectedPath("/api/admin/login")).toBe(false);
    expect(isProtectedPath("/_next/static/chunk.js")).toBe(false);
    expect(isProtectedPath("/favicon.ico")).toBe(false);
    expect(isProtectedPath("/images/avatar.jpg")).toBe(false);
  });
});
