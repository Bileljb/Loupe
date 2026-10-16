import { reportSchema, type Issue, type Platform, type Report } from "@/lib/schemas";
import { getReportStorage, type GetReportResult } from "@/lib/storage/reports";
import exampleJson from "./exampleReport.json";

/** `/report/example` shows a fixed, never-expiring report built from the test fixtures. */
export const EXAMPLE_REPORT_ID = "example";

export type LoadedReport = GetReportResult & { isExample?: boolean };

export async function loadReport(id: string): Promise<LoadedReport> {
  if (id === EXAMPLE_REPORT_ID) return { status: "found", report: exampleReport(), isExample: true };
  return getReportStorage().getReport(id);
}

export function exampleReport(): Report {
  return reportSchema.parse(exampleJson);
}

/** Brand names, shown as-is in every language. */
export const platformNames: Record<Exclude<Platform, "unknown">, string> = {
  wordpress: "WordPress",
  wix: "Wix",
  shopify: "Shopify",
  squarespace: "Squarespace",
  webflow: "Webflow",
};

/** The platform to tailor fixes for. Low-confidence guesses fall back to generic steps. */
export function trustedPlatform(report: Report): Exclude<Platform, "unknown"> | null {
  const platform = report.platform;
  if (!platform || platform.name === "unknown" || platform.confidence === "low") return null;
  return platform.name;
}

export type VitalKey = "lcp" | "fcp" | "ttfb" | "cls" | "interactivity";

export type Vital = {
  key: VitalKey;
  good: boolean;
  /** Seconds, for time-based metrics shown to owners. Layout stability and tap response show status only. */
  seconds?: number;
};

const VITAL_IDS: Record<string, VitalKey> = {
  "performance.lcp.slow": "lcp",
  "performance.first-paint.slow": "fcp",
  "performance.server.slow": "ttfb",
  "performance.cls.high": "cls",
  "performance.interactivity.slow": "interactivity",
};
const VITAL_ORDER: VitalKey[] = ["lcp", "fcp", "ttfb", "cls", "interactivity"];
const TIMED = new Set<VitalKey>(["lcp", "fcp", "ttfb"]);

/** Core Web Vitals in plain words, read from the evidence of the PSI metric issues. */
export function vitalsFrom(issues: Issue[]): Vital[] {
  const vitals: Vital[] = [];
  for (const issue of issues) {
    const key = VITAL_IDS[issue.id];
    if (!key) continue;
    const value = issue.evidence?.value;
    const seconds =
      TIMED.has(key) && typeof value === "number" ? Math.round(value / 100) / 10 : undefined;
    vitals.push({ key, good: issue.passed, ...(seconds !== undefined ? { seconds } : {}) });
  }
  return vitals.sort((a, b) => VITAL_ORDER.indexOf(a.key) - VITAL_ORDER.indexOf(b.key));
}

/** The status code when the site answered with an error page (often a bot block), else null. */
export function blockedStatus(issues: Issue[]): number | null {
  const issue = issues.find((candidate) => candidate.id === "technical.status.error");
  const status = issue?.evidence?.status;
  return issue && !issue.passed && typeof status === "number" ? status : null;
}
