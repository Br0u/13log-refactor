import { describe, expect, it } from "vitest";

import { computeRiskAssessment, isProtectedPath } from "../../lib/risk-control";

describe("risk control", () => {
  it("scores high risk requests as bot", () => {
    const assessment = computeRiskAssessment({
      country: "CN",
      region: "",
      city: "",
      userAgent: "Mozilla/5.0 Chrome/142.0.0.0 Safari/537.36",
      referer: "",
      isDataCenter: true,
    });

    expect(assessment.riskScore).toBe(110);
    expect(assessment.riskLabel).toBe("bot");
  });

  it("marks medium risk requests as suspicious", () => {
    const assessment = computeRiskAssessment({
      country: "CA",
      region: "Ontario",
      city: "Guelph",
      userAgent: "Mozilla/5.0 Chrome/142.0.0.0 Safari/537.36",
      referer: "",
      isDataCenter: false,
    });

    expect(assessment.riskScore).toBe(40);
    expect(assessment.riskLabel).toBe("suspicious");
  });

  it("keeps low risk requests normal", () => {
    const assessment = computeRiskAssessment({
      country: "CA",
      region: "Ontario",
      city: "Guelph",
      userAgent: "Mozilla/5.0 Chrome/141.0.0.0 Safari/537.36",
      referer: "https://example.com",
      isDataCenter: false,
    });

    expect(assessment.riskScore).toBe(0);
    expect(assessment.riskLabel).toBe("normal");
  });

  it("protects business routes and skips static assets", () => {
    expect(isProtectedPath("/posts")).toBe(true);
    expect(isProtectedPath("/api/comments")).toBe(true);
    expect(isProtectedPath("/admin")).toBe(true);
    expect(isProtectedPath("/_next/static/chunk.js")).toBe(false);
    expect(isProtectedPath("/favicon.ico")).toBe(false);
    expect(isProtectedPath("/images/avatar.jpg")).toBe(false);
  });
});
