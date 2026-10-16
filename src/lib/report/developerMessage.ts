import type { Issue, Severity } from "@/lib/schemas";

export type DeveloperMessageLabels = {
  heading: string;
  checkedOn: string;
  report: string;
  platform?: string;
  groups: Record<Severity, string>;
  fix: string;
  evidence: string;
  example: string;
  none: string;
};

export type DeveloperMessageEntry = { title: string; fix: string; platformFix?: string; snippet?: string };

const SEVERITIES: Severity[] = ["critical", "warning", "info"];
const MAX_EVIDENCE_CHARS = 600;

function evidenceText(evidence: Issue["evidence"]): string | null {
  if (!evidence || Object.keys(evidence).length === 0) return null;
  const text = JSON.stringify(evidence);
  return text.length > MAX_EVIDENCE_CHARS ? `${text.slice(0, MAX_EVIDENCE_CHARS)}…` : text;
}

const indent = (text: string, prefix: string) =>
  text
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");

/**
 * Turns failed issues into a copy-paste to-do list for a developer: grouped by priority,
 * with check ids, evidence and example code. Pure: labels and KB text come from the caller,
 * so the same function builds the message in any language.
 */
export function buildDeveloperMessage(
  issues: Issue[],
  entryFor: (issue: Issue) => DeveloperMessageEntry,
  labels: DeveloperMessageLabels,
): string {
  const lines = [labels.heading, labels.checkedOn, labels.report];
  if (labels.platform) lines.push(labels.platform);

  const failed = issues.filter((issue) => !issue.passed);
  if (failed.length === 0) return [...lines, "", labels.none].join("\n");

  let number = 0;
  for (const severity of SEVERITIES) {
    const group = failed.filter((issue) => issue.severity === severity);
    if (group.length === 0) continue;
    lines.push("", `== ${labels.groups[severity]} (${group.length}) ==`);
    for (const issue of group) {
      const entry = entryFor(issue);
      number += 1;
      lines.push("", `${number}. [${issue.id}] ${entry.title}`);
      lines.push(`   ${labels.fix}: ${entry.platformFix ?? entry.fix}`);
      const evidence = evidenceText(issue.evidence);
      if (evidence) lines.push(`   ${labels.evidence}: ${evidence}`);
      if (entry.snippet) lines.push(`   ${labels.example}:`, indent(entry.snippet, "     "));
    }
  }
  return lines.join("\n");
}
