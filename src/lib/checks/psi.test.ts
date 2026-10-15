import { describe, expect, it } from "vitest";
import { checkIds } from "./registry";
import { MAX_OPPORTUNITIES, mapPsiResult, psiResponseSchema, type PsiResponse } from "./psi";
import { failedIds, find, fixture } from "./testUtils";

const real = (name: string) => psiResponseSchema.parse(JSON.parse(fixture(`psi/${name}.json`)));

type AuditInput = PsiResponse["lighthouseResult"]["audits"][string];

/** A minimal successful response; every metric is good unless overridden. */
function response(
  audits: Record<string, AuditInput> = {},
  auditRefs: { id: string; group?: string }[] = [],
): PsiResponse {
  return {
    lighthouseResult: {
      lighthouseVersion: "13.5.0",
      categories: { performance: { score: 0.95, auditRefs }, accessibility: { score: 0.876 } },
      audits: {
        "largest-contentful-paint": { numericValue: 1200 },
        "cumulative-layout-shift": { numericValue: 0.01 },
        "total-blocking-time": { numericValue: 50 },
        "first-contentful-paint": { numericValue: 900 },
        "server-response-time": { numericValue: 100 },
        ...audits,
      },
    },
  };
}

const failing = (savings: number, extra: Partial<AuditInput> = {}): AuditInput => ({
  score: 0,
  scoreDisplayMode: "metricSavings",
  metricSavings: { LCP: savings, FCP: 0 },
  ...extra,
});
const passing: AuditInput = { score: 1, scoreDisplayMode: "metricSavings" };

describe("real PSI responses (Lighthouse 13)", () => {
  it("maps a slow page to metric and opportunity issues with evidence", () => {
    const result = mapPsiResult(real("wordpress-org"));
    expect(result.scores).toEqual({ performance: 74, accessibility: 100, seo: 100, bestPractices: 100 });
    expect(result.lighthouseVersion).toBe("13.5.0");

    expect(find(result.issues, "performance.lcp.slow")).toMatchObject({
      passed: false,
      evidence: { metric: "LCP", value: 5476, unit: "ms", goodThreshold: 2500, field: { metric: "LCP", value: 2890 } },
    });
    // CrUX stores CLS x100; evidence holds the real value.
    expect(find(result.issues, "performance.cls.high")).toMatchObject({ passed: true, evidence: { field: { value: 0.01 } } });
    expect(find(result.issues, "performance.interactivity.slow")).toMatchObject({
      passed: false,
      evidence: { metric: "TBT", value: 212, field: { metric: "INP", value: 126 } },
    });

    expect(find(result.issues, "performance.render-blocking")).toMatchObject({
      passed: false,
      evidence: { estimatedSavingsMs: 2200, audits: [{ id: "render-blocking-insight" }] },
    });
    const unused = find(result.issues, "performance.unused-code");
    expect(unused.evidence?.audits).toHaveLength(2);
    expect((unused.evidence?.urls as string[]).length).toBeLessThanOrEqual(5);
    // Text compression comes from the document latency checklist in Lighthouse 13.
    expect(find(result.issues, "performance.text-compression").passed).toBe(true);
    expect(find(result.issues, "performance.caching").passed).toBe(true);
  });

  it("keeps a fast page clean", () => {
    const result = mapPsiResult(real("example-com"));
    expect(result.scores.performance).toBe(100);
    expect(failedIds(result.issues)).toEqual(["performance.caching"]);
    // PSI didn't measure compression here, so we make no claim about it.
    expect(result.issues.some((issue) => issue.id === "performance.text-compression")).toBe(false);
  });

  it("only produces known, unique check ids", () => {
    for (const name of ["wordpress-org", "example-com"]) {
      const ids = mapPsiResult(real(name)).issues.map((issue) => issue.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(checkIds).toContain(id);
    }
  });
});

describe("metrics", () => {
  it("fails each metric just above its good threshold and skips missing ones", () => {
    const result = mapPsiResult(
      response({
        "largest-contentful-paint": { numericValue: 2501 },
        "cumulative-layout-shift": { numericValue: 0.1 },
        "server-response-time": {},
      }),
    );
    expect(find(result.issues, "performance.lcp.slow").passed).toBe(false);
    expect(find(result.issues, "performance.cls.high").passed).toBe(true);
    expect(result.issues.some((issue) => issue.id === "performance.server.slow")).toBe(false);
  });

  it("rounds scores to whole numbers and keeps missing categories null", () => {
    expect(mapPsiResult(response()).scores).toEqual({ performance: 95, accessibility: 88, seo: null, bestPractices: null });
  });
});

describe("opportunities", () => {
  it("maps legacy audit ids and groups several audits under one issue", () => {
    const result = mapPsiResult(
      response({ "uses-optimized-images": failing(300), "modern-image-formats": failing(900), "uses-text-compression": failing(100) }),
    );
    const images = find(result.issues, "performance.images.unoptimized");
    expect(images.evidence).toMatchObject({ estimatedSavingsMs: 900, audits: [{ id: "modern-image-formats" }, { id: "uses-optimized-images" }] });
    expect(find(result.issues, "performance.text-compression").passed).toBe(false);
  });

  it("flags compression from the document latency checklist", () => {
    const result = mapPsiResult(
      response({
        "document-latency-insight": failing(400, {
          details: { type: "checklist", items: { usesCompression: { value: false }, serverResponseIsFast: { value: true } } },
        }),
      }),
    );
    expect(find(result.issues, "performance.text-compression")).toMatchObject({
      passed: false,
      evidence: { audits: [{ id: "document-latency-insight" }] },
    });
  });

  it("sends unmapped failing audits with real savings to one fallback issue", () => {
    const refs = [
      { id: "lcp-discovery-insight", group: "insights" },
      { id: "forced-reflow-insight", group: "insights" },
      { id: "network-dependency-tree-insight", group: "insights" },
      { id: "made-up-hidden", group: "hidden" },
      { id: "render-blocking-insight", group: "insights" },
    ];
    const result = mapPsiResult(
      response(
        {
          "lcp-discovery-insight": failing(500),
          "forced-reflow-insight": failing(200),
          "network-dependency-tree-insight": failing(0),
          "made-up-hidden": failing(999),
          "render-blocking-insight": failing(100),
        },
        refs,
      ),
    );
    const other = find(result.issues, "performance.other");
    expect(other.evidence?.audits).toEqual([
      expect.objectContaining({ id: "lcp-discovery-insight", savingsMs: 500 }),
      expect.objectContaining({ id: "forced-reflow-insight", savingsMs: 200 }),
    ]);
    // Mapped audits never leak into the fallback.
    expect(find(result.issues, "performance.render-blocking").passed).toBe(false);
  });

  it(`keeps only the top ${MAX_OPPORTUNITIES} failed opportunities, ranked by savings`, () => {
    const result = mapPsiResult(
      response(
        {
          "image-delivery-insight": failing(100),
          "render-blocking-insight": failing(600),
          "unused-javascript": failing(500),
          "uses-text-compression": failing(400),
          "cache-insight": failing(300),
          "lcp-discovery-insight": failing(200),
        },
        [{ id: "lcp-discovery-insight", group: "insights" }],
      ),
    );
    const opportunities = result.issues.filter((issue) => !issue.passed && !("metric" in (issue.evidence ?? {})));
    expect(opportunities.map((issue) => issue.id)).toEqual([
      "performance.render-blocking",
      "performance.unused-code",
      "performance.text-compression",
      "performance.caching",
      "performance.other",
    ]);
    // Cut by the limit is not the same as passing.
    expect(result.issues.some((issue) => issue.id === "performance.images.unoptimized")).toBe(false);
  });

  it("passes measured opportunities, ignores unscored ones", () => {
    const result = mapPsiResult(
      response({
        "cache-insight": passing,
        "render-blocking-insight": { score: null, scoreDisplayMode: "notApplicable" },
        "unused-javascript": { score: 0.95, scoreDisplayMode: "metricSavings" },
      }),
    );
    expect(find(result.issues, "performance.caching").passed).toBe(true);
    expect(find(result.issues, "performance.unused-code").passed).toBe(true);
    expect(result.issues.some((issue) => issue.id === "performance.render-blocking")).toBe(false);
  });

  it("keeps only http(s) URLs in evidence", () => {
    const result = mapPsiResult(
      response({
        "cache-insight": failing(10, {
          details: { type: "table", items: [{ url: "https://a.example/x.js" }, { url: "javascript:alert(1)" }, { node: {} }] },
        }),
      }),
    );
    expect(find(result.issues, "performance.caching").evidence?.urls).toEqual(["https://a.example/x.js"]);
  });
});
