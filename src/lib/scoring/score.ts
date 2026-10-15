import { checkRegistry, type CheckId } from "@/lib/checks/registry";
import { FALLBACK_ID } from "@/lib/kb";
import { shared } from "@/lib/kb/shared";
import type { Level } from "@/lib/kb/types";
import type { Category, Issue, Report, Severity } from "@/lib/schemas";

// Tunable, but keep it explainable: every number here can be stated in one sentence in the UI or README.

export const PENALTIES: Record<Severity, number> = { critical: 15, warning: 7, info: 2 };

export const WEIGHTS: Record<Category, number> = {
  performance: 0.35,
  seo: 0.25,
  accessibility: 0.2,
  technical: 0.2,
};

export type Scores = Report["scores"];

/** What each source produced. null means that source failed or didn't run. */
export type ScoreInputs = {
  issues: Issue[];
  psi: { performance: number; accessibility: number | null } | null;
  htmlChecked: boolean;
};

/** 100 minus a penalty per failed issue, floored at 0. */
export function penaltyScore(issues: Issue[], category: Category): number {
  const penalty = issues
    .filter((issue) => issue.category === category && !issue.passed)
    .reduce((sum, issue) => sum + PENALTIES[issue.severity], 0);
  return Math.max(0, 100 - penalty);
}

function minOf(...values: (number | null)[]): number | null {
  const known = values.filter((value): value is number => value !== null);
  return known.length ? Math.min(...known) : null;
}

/** Weighted average over the categories we could check; weights are rescaled so they still sum to 1. */
export function overallScore(scores: Record<Category, number | null>): number {
  let total = 0;
  let weight = 0;
  for (const [category, value] of Object.entries(scores) as [Category, number | null][]) {
    if (value === null) continue;
    total += value * WEIGHTS[category];
    weight += WEIGHTS[category];
  }
  return weight === 0 ? 0 : Math.round(total / weight);
}

export function computeScores({ issues, psi, htmlChecked }: ScoreInputs): Scores {
  const html = (category: Category) => (htmlChecked ? penaltyScore(issues, category) : null);
  const categories: Record<Category, number | null> = {
    // Performance uses the PSI score directly.
    performance: psi ? Math.round(psi.performance) : null,
    seo: html("seo"),
    technical: html("technical"),
    // Google's automated score and our own checks look at overlapping things (alt text, labels...),
    // so we take the lower of the two instead of stacking penalties on top of Google's score.
    accessibility: minOf(psi?.accessibility ?? null, html("accessibility")),
  };
  return { overall: overallScore(categories), ...categories };
}

export type Grade = "A" | "B" | "C" | "D" | "F";

export function letterGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

const SEVERITY_RANK: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };
const LEVEL_RANK: Record<Level, number> = { high: 2, medium: 1, low: 0 };

function sharedEntry(id: string) {
  return shared[Object.hasOwn(checkRegistry, id) ? (id as CheckId) : FALLBACK_ID];
}

/** Failed first, then severity, then impact (high first), then effort (low first). Stable by id. */
export function sortIssues(issues: Issue[]): Issue[] {
  return [...issues].sort((a, b) => {
    const ea = sharedEntry(a.id);
    const eb = sharedEntry(b.id);
    return (
      Number(a.passed) - Number(b.passed) ||
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      LEVEL_RANK[eb.impact] - LEVEL_RANK[ea.impact] ||
      LEVEL_RANK[ea.effort] - LEVEL_RANK[eb.effort] ||
      a.id.localeCompare(b.id)
    );
  });
}

/** "Fix these first": the failed issues with the highest impact and lowest effort. */
export function fixFirst(issues: Issue[], count = 3): Issue[] {
  return issues
    .filter((issue) => !issue.passed)
    .map((issue) => ({ issue, entry: sharedEntry(issue.id) }))
    .sort(
      (a, b) =>
        LEVEL_RANK[b.entry.impact] - LEVEL_RANK[a.entry.impact] ||
        LEVEL_RANK[a.entry.effort] - LEVEL_RANK[b.entry.effort] ||
        SEVERITY_RANK[a.issue.severity] - SEVERITY_RANK[b.issue.severity] ||
        a.issue.id.localeCompare(b.issue.id),
    )
    .slice(0, count)
    .map(({ issue }) => issue);
}
