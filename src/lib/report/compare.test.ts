import { describe, expect, it } from "vitest";
import { makeIssue } from "@/lib/checks/registry";
import type { Report } from "@/lib/schemas";
import { compareReports } from "./compare";

function report(overrides: Partial<Report>): Report {
  return {
    schemaVersion: 1,
    id: "previous-report-1",
    url: "https://rosas-bakery.example/",
    createdAt: "2026-10-01T09:00:00.000Z",
    scores: { overall: 70, performance: 60, seo: 70, accessibility: 80, technical: 85 },
    issues: [],
    localChecks: false,
    ...overrides,
  };
}

const ids = (issues: { id: string }[]) => issues.map((issue) => issue.id).sort();

describe("compareReports", () => {
  const previous = report({
    issues: [
      makeIssue("seo.title.missing", false),
      makeIssue("seo.meta-description.missing", false),
      makeIssue("seo.h1.missing", true),
      makeIssue("technical.favicon.missing", false),
      makeIssue("performance.images.unoptimized", false, { estimatedSavingsMs: 900 }),
    ],
  });
  const current = report({
    id: "current-report-1",
    previousReportId: "previous-report-1",
    scores: { overall: 81, performance: 72, seo: 85, accessibility: 80, technical: 85 },
    issues: [
      makeIssue("seo.title.missing", true),
      makeIssue("seo.meta-description.missing", false),
      makeIssue("seo.h1.missing", false),
      makeIssue("technical.favicon.missing", false),
      makeIssue("performance.render-blocking", false, { estimatedSavingsMs: 300 }),
    ],
  });

  it("sorts issues into fixed, new and still open by id", () => {
    const comparison = compareReports(previous, current);
    // The images issue disappeared from a checked area: PSI only reports failures, so it is fixed.
    expect(ids(comparison.fixed)).toEqual(["performance.images.unoptimized", "seo.title.missing"]);
    expect(ids(comparison.newIssues)).toEqual(["performance.render-blocking", "seo.h1.missing"]);
    expect(ids(comparison.stillOpen)).toEqual(["seo.meta-description.missing", "technical.favicon.missing"]);
  });

  it("reports score changes per area and overall", () => {
    const comparison = compareReports(previous, current);
    expect(comparison.overall).toEqual({ before: 70, after: 81, delta: 11 });
    expect(comparison.categories.seo).toEqual({ before: 70, after: 85, delta: 15 });
    expect(comparison.categories.accessibility).toEqual({ before: 80, after: 80, delta: 0 });
  });

  it("doesn't call anything fixed or new in an area that one run couldn't check", () => {
    const speedFailed = report({
      ...current,
      scores: { ...current.scores, performance: null },
      issues: current.issues.filter((issue) => issue.category !== "performance"),
      partial: { psiFailed: true },
    });
    const comparison = compareReports(previous, speedFailed);
    expect(ids(comparison.fixed)).toEqual(["seo.title.missing"]);
    expect(ids(comparison.newIssues)).toEqual(["seo.h1.missing"]);
    expect(comparison.categories.performance).toEqual({ before: 60, after: null, delta: null });
  });

  it("finds nothing to report between identical runs", () => {
    const comparison = compareReports(previous, { ...previous, id: "same-again-0001" });
    expect(comparison.fixed).toEqual([]);
    expect(comparison.newIssues).toEqual([]);
    expect(comparison.stillOpen).toHaveLength(4);
    expect(comparison.overall.delta).toBe(0);
  });
});
