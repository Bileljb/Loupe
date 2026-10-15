import { describe, expect, it } from "vitest";
import { makeIssue } from "@/lib/checks/registry";
import type { Issue } from "@/lib/schemas";
import { computeScores, fixFirst, letterGrade, overallScore, penaltyScore, sortIssues } from "./score";

const fail = (id: Parameters<typeof makeIssue>[0]) => makeIssue(id, false);
const pass = (id: Parameters<typeof makeIssue>[0]) => makeIssue(id, true);

// Fixed fixture: one critical, one warning and two info failures in SEO; one warning in technical.
const issues: Issue[] = [
  fail("seo.title.missing"), // critical -15
  fail("seo.meta-description.missing"), // warning -7
  fail("seo.canonical.missing"), // info -2
  fail("seo.open-graph.incomplete"), // info -2
  pass("seo.h1.missing"),
  fail("technical.sitemap.missing"), // warning -7
  pass("technical.https.missing"),
  fail("accessibility.img-alt.missing"), // warning -7
];

describe("penaltyScore", () => {
  it("subtracts per failed issue and ignores passes and other categories", () => {
    expect(penaltyScore(issues, "seo")).toBe(74);
    expect(penaltyScore(issues, "technical")).toBe(93);
    expect(penaltyScore([], "seo")).toBe(100);
  });

  it("floors at 0", () => {
    const many = Array.from({ length: 10 }, () => fail("seo.title.missing"));
    expect(penaltyScore(many, "seo")).toBe(0);
  });
});

describe("computeScores", () => {
  it("uses PSI for performance and the lower accessibility score", () => {
    expect(computeScores({ issues, psi: { performance: 62, accessibility: 88 }, htmlChecked: true })).toEqual({
      performance: 62,
      seo: 74,
      technical: 93,
      accessibility: 88, // min(88 from Google, 93 from our checks)
      // 62*.35 + 74*.25 + 88*.2 + 93*.2 = 76.4
      overall: 76,
    });
    expect(computeScores({ issues, psi: { performance: 62, accessibility: 100 }, htmlChecked: true }).accessibility).toBe(93);
  });

  it("leaves unchecked categories null and rescales the weights (PSI failed)", () => {
    const scores = computeScores({ issues, psi: null, htmlChecked: true });
    expect(scores).toMatchObject({ performance: null, seo: 74, technical: 93, accessibility: 93 });
    // (74*.25 + 93*.2 + 93*.2) / .65 = 85.8
    expect(scores.overall).toBe(86);
  });

  it("scores only performance and accessibility when the page fetch failed", () => {
    const scores = computeScores({ issues: [], psi: { performance: 50, accessibility: 90 }, htmlChecked: false });
    expect(scores).toEqual({ performance: 50, seo: null, technical: null, accessibility: 90, overall: 65 });
    // (50*.35 + 90*.2) / .55 = 64.5
  });

  it("keeps the accessibility score null when neither source has it", () => {
    expect(computeScores({ issues: [], psi: { performance: 80, accessibility: null }, htmlChecked: false })).toMatchObject({
      accessibility: null,
      overall: 80,
    });
  });

  it("returns whole numbers only", () => {
    const scores = computeScores({ issues, psi: { performance: 61.6, accessibility: 87 }, htmlChecked: true });
    for (const value of Object.values(scores)) if (value !== null) expect(Number.isInteger(value)).toBe(true);
  });
});

describe("overallScore and letterGrade", () => {
  it("returns 0 when nothing could be scored", () => {
    expect(overallScore({ performance: null, seo: null, accessibility: null, technical: null })).toBe(0);
  });

  it.each([
    [100, "A"],
    [90, "A"],
    [89, "B"],
    [80, "B"],
    [79, "C"],
    [70, "C"],
    [69, "D"],
    [60, "D"],
    [59, "F"],
    [0, "F"],
  ] as const)("%i is %s", (score, grade) => {
    expect(letterGrade(score)).toBe(grade);
  });
});

describe("prioritization", () => {
  it("sorts failed first, then by severity, impact and effort", () => {
    const sorted = sortIssues([
      pass("seo.title.missing"),
      fail("seo.canonical.missing"), // info
      fail("technical.sitemap.missing"), // warning
      fail("seo.title.missing"), // critical
      fail("seo.viewport.missing"), // warning, high impact
    ]).map((issue) => `${issue.id}:${issue.passed}`);
    expect(sorted).toEqual([
      "seo.title.missing:false",
      "seo.viewport.missing:false",
      "technical.sitemap.missing:false",
      "seo.canonical.missing:false",
      "seo.title.missing:true",
    ]);
  });

  it("sorts unknown ids like the fallback entry instead of crashing", () => {
    const unknown: Issue = { id: "performance.some-new-audit", category: "performance", severity: "info", passed: false };
    expect(sortIssues([unknown, pass("seo.h1.missing")])[0]).toBe(unknown);
  });

  it("picks the 3 failed issues with the highest impact and lowest effort", () => {
    const picked = fixFirst([
      fail("seo.title.missing"), // high impact, low effort
      fail("seo.canonical.missing"), // low impact
      fail("seo.viewport.missing"), // high impact, low effort
      fail("seo.meta-description.missing"), // medium impact, low effort
      pass("seo.h1.missing"),
      fail("seo.open-graph.incomplete"), // low impact
    ]).map((issue) => issue.id);
    expect(picked).toEqual(["seo.title.missing", "seo.viewport.missing", "seo.meta-description.missing"]);
    expect(fixFirst([pass("seo.title.missing")])).toEqual([]);
  });
});
