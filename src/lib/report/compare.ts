import { categorySchema, type Category, type Issue, type Report } from "@/lib/schemas";

export type ScoreChange = {
  before: number | null;
  after: number | null;
  /** after - before; null when either side wasn't checked. */
  delta: number | null;
};

export type Comparison = {
  overall: ScoreChange;
  categories: Record<Category, ScoreChange>;
  /** Failed before, passing (or no longer reported) now. */
  fixed: Issue[];
  /** Failing now, and passing (or not found) before. */
  newIssues: Issue[];
  /** Failing in both reports. Holds the current issue. */
  stillOpen: Issue[];
};

function change(before: number | null, after: number | null): ScoreChange {
  return { before, after, delta: before === null || after === null ? null : after - before };
}

/**
 * Matches issues by id. Only areas checked in BOTH reports are compared: if the speed test
 * failed on one run, its issues are neither "fixed" nor "new", because we simply don't know.
 * PSI only reports failing opportunities, so an issue that disappears from a checked area counts as fixed.
 */
export function compareReports(previous: Report, current: Report): Comparison {
  const checkedInBoth = (category: Category) =>
    previous.scores[category] !== null && current.scores[category] !== null;
  const before = new Map(previous.issues.map((issue) => [issue.id, issue]));
  const after = new Map(current.issues.map((issue) => [issue.id, issue]));

  const fixed: Issue[] = [];
  const newIssues: Issue[] = [];
  const stillOpen: Issue[] = [];

  for (const old of previous.issues) {
    if (old.passed || !checkedInBoth(old.category)) continue;
    const now = after.get(old.id);
    if (!now || now.passed) fixed.push(old);
    else stillOpen.push(now);
  }
  for (const now of current.issues) {
    if (now.passed || !checkedInBoth(now.category)) continue;
    const old = before.get(now.id);
    if (!old || old.passed) newIssues.push(now);
  }

  const categories = Object.fromEntries(
    categorySchema.options.map((category) => [category, change(previous.scores[category], current.scores[category])]),
  ) as Record<Category, ScoreChange>;

  return {
    overall: change(previous.scores.overall, current.scores.overall),
    categories,
    fixed,
    newIssues,
    stillOpen,
  };
}
