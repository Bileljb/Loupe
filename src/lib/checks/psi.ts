import { z } from "zod";
import type { Issue } from "@/lib/schemas";
import { makeIssue, type CheckId } from "./registry";

// Only the PSI fields we use. Zod strips everything else, so Lighthouse changes elsewhere can't break parsing.

const auditSchema = z.object({
  title: z.string().optional(),
  score: z.number().nullable().optional(),
  scoreDisplayMode: z.string().optional(),
  numericValue: z.number().optional(),
  displayValue: z.string().optional(),
  metricSavings: z.record(z.string(), z.number()).optional(),
  details: z
    .object({
      type: z.string().optional(),
      items: z.unknown().optional(),
      overallSavingsMs: z.number().optional(),
    })
    .optional(),
});
type Audit = z.infer<typeof auditSchema>;

const categoryScoreSchema = z.object({ score: z.number().nullable() });

const fieldMetricSchema = z.object({ percentile: z.number(), category: z.string().optional() });

export const psiResponseSchema = z.object({
  loadingExperience: z
    .object({ metrics: z.record(z.string(), fieldMetricSchema).optional() })
    .optional(),
  lighthouseResult: z.object({
    lighthouseVersion: z.string(),
    runtimeError: z.object({ code: z.string() }).optional(),
    categories: z.object({
      performance: categoryScoreSchema.extend({
        auditRefs: z.array(z.object({ id: z.string(), group: z.string().optional() })).optional(),
      }),
      accessibility: categoryScoreSchema.optional(),
      seo: categoryScoreSchema.optional(),
      "best-practices": categoryScoreSchema.optional(),
    }),
    audits: z.record(z.string(), auditSchema),
  }),
});
export type PsiResponse = z.infer<typeof psiResponseSchema>;

export type PsiScores = {
  performance: number;
  accessibility: number | null;
  seo: number | null;
  bestPractices: number | null;
};

export type PsiResult = {
  issues: Issue[];
  // Whole numbers 0-100. The accessibility score is the base accessibility signal for scoring.
  scores: PsiScores;
  lighthouseVersion: string;
};

/** Lab metrics from our mobile run. "good" thresholds follow Google's published guidance. */
const METRICS: {
  id: CheckId;
  metric: string;
  audit: string;
  good: number;
  field?: { key: string; metric: string; scale?: number };
}[] = [
  { id: "performance.lcp.slow", metric: "LCP", audit: "largest-contentful-paint", good: 2500, field: { key: "LARGEST_CONTENTFUL_PAINT_MS", metric: "LCP" } },
  // CrUX reports CLS multiplied by 100.
  { id: "performance.cls.high", metric: "CLS", audit: "cumulative-layout-shift", good: 0.1, field: { key: "CUMULATIVE_LAYOUT_SHIFT_SCORE", metric: "CLS", scale: 0.01 } },
  // A lab run can't measure INP, so TBT is the lab proxy; real-user INP is added when available.
  { id: "performance.interactivity.slow", metric: "TBT", audit: "total-blocking-time", good: 200, field: { key: "INTERACTION_TO_NEXT_PAINT", metric: "INP" } },
  { id: "performance.first-paint.slow", metric: "FCP", audit: "first-contentful-paint", good: 1800, field: { key: "FIRST_CONTENTFUL_PAINT_MS", metric: "FCP" } },
  { id: "performance.server.slow", metric: "TTFB", audit: "server-response-time", good: 600, field: { key: "EXPERIMENTAL_TIME_TO_FIRST_BYTE", metric: "TTFB" } },
];

/** Lighthouse 13 insight ids first, then the older audit ids they replaced. */
const OPPORTUNITIES: Record<string, CheckId> = {
  "image-delivery-insight": "performance.images.unoptimized",
  "uses-optimized-images": "performance.images.unoptimized",
  "modern-image-formats": "performance.images.unoptimized",
  "uses-responsive-images": "performance.images.unoptimized",
  "offscreen-images": "performance.images.unoptimized",
  "efficient-animated-content": "performance.images.unoptimized",
  "render-blocking-insight": "performance.render-blocking",
  "render-blocking-resources": "performance.render-blocking",
  "unused-javascript": "performance.unused-code",
  "unused-css-rules": "performance.unused-code",
  "unminified-javascript": "performance.unused-code",
  "unminified-css": "performance.unused-code",
  "duplicated-javascript-insight": "performance.unused-code",
  "legacy-javascript-insight": "performance.unused-code",
  "duplicated-javascript": "performance.unused-code",
  "legacy-javascript": "performance.unused-code",
  "uses-text-compression": "performance.text-compression",
  "cache-insight": "performance.caching",
  "uses-long-cache-ttl": "performance.caching",
};

// Covered elsewhere (metric issues, technical.redirects) or handled specially below; never sent to "other".
const NOT_OTHER = new Set(["document-latency-insight", "redirects", ...METRICS.map((m) => m.audit)]);
const OTHER_GROUPS = new Set(["insights", "diagnostics"]);
const SCORED_MODES = new Set(["metricSavings", "numeric", "binary"]);

export const MAX_OPPORTUNITIES = 5;
const MAX_URLS = 5;

function toScore(score: number | null | undefined): number | null {
  return typeof score === "number" ? Math.round(score * 100) : null;
}

function isFailing(audit: Audit): boolean {
  return (
    SCORED_MODES.has(audit.scoreDisplayMode ?? "") && typeof audit.score === "number" && audit.score < 0.9
  );
}

function hasScore(audit: Audit): boolean {
  return SCORED_MODES.has(audit.scoreDisplayMode ?? "") && typeof audit.score === "number";
}

/** Estimated time saved, used only to rank opportunities. */
function savingsMs(audit: Audit): number {
  const savings = audit.metricSavings ?? {};
  return Math.max(0, audit.details?.overallSavingsMs ?? 0, savings.LCP ?? 0, savings.FCP ?? 0, savings.TBT ?? 0, savings.INP ?? 0);
}

const itemsSchema = z.array(z.object({ url: z.string().optional() }).loose());

function resourceUrls(audit: Audit): string[] {
  const parsed = itemsSchema.safeParse(audit.details?.items);
  if (!parsed.success) return [];
  return parsed.data.flatMap((item) => (item.url && /^https?:\/\//.test(item.url) ? [item.url] : []));
}

function metricIssues(response: PsiResponse): Issue[] {
  const { audits } = response.lighthouseResult;
  const field = response.loadingExperience?.metrics ?? {};
  const issues: Issue[] = [];
  for (const metric of METRICS) {
    const audit = audits[metric.audit];
    // No measurement, no claim.
    if (typeof audit?.numericValue !== "number") continue;
    const value = metric.metric === "CLS" ? Math.round(audit.numericValue * 1000) / 1000 : Math.round(audit.numericValue);
    const evidence: Record<string, unknown> = {
      metric: metric.metric,
      value,
      unit: metric.metric === "CLS" ? "unitless" : "ms",
      goodThreshold: metric.good,
      source: "lab",
    };
    if (audit.displayValue) evidence.displayValue = audit.displayValue;
    const real = metric.field && field[metric.field.key];
    if (metric.field && real) {
      evidence.field = {
        metric: metric.field.metric,
        value: Math.round(real.percentile * (metric.field.scale ?? 1) * 1000) / 1000,
        category: real.category,
      };
    }
    issues.push(makeIssue(metric.id, value <= metric.good, evidence));
  }
  return issues;
}

type Finding = { id: string; title?: string; displayValue?: string; savingsMs: number; urls: string[] };

function finding(id: string, audit: Audit): Finding {
  return {
    id,
    title: audit.title,
    displayValue: audit.displayValue,
    savingsMs: Math.round(savingsMs(audit)),
    urls: resourceUrls(audit),
  };
}

/** Lighthouse 13 folds text compression into the document latency checklist. */
function compressionFinding(audits: Record<string, Audit>): { seen: boolean; failing?: Finding } {
  const audit = audits["document-latency-insight"];
  const parsed = z
    .object({ usesCompression: z.object({ value: z.boolean() }) })
    .safeParse(audit?.details?.items);
  if (!audit || !parsed.success) return { seen: false };
  if (parsed.data.usesCompression.value) return { seen: true };
  return { seen: true, failing: finding("document-latency-insight", audit) };
}

function opportunityIssues(response: PsiResponse): Issue[] {
  const { audits, categories } = response.lighthouseResult;
  const failing = new Map<CheckId, Finding[]>();
  const seen = new Set<CheckId>();
  const add = (id: CheckId, item: Finding) => failing.set(id, [...(failing.get(id) ?? []), item]);

  for (const [auditId, checkId] of Object.entries(OPPORTUNITIES)) {
    const audit = audits[auditId];
    if (!audit || !hasScore(audit)) continue;
    seen.add(checkId);
    if (isFailing(audit)) add(checkId, finding(auditId, audit));
  }

  const compression = compressionFinding(audits);
  if (compression.seen) seen.add("performance.text-compression");
  if (compression.failing) add("performance.text-compression", compression.failing);

  // Failing performance audits we have no specific advice for share one fallback issue,
  // but only when PSI estimates a real time saving (otherwise it's noise for an owner).
  for (const ref of categories.performance.auditRefs ?? []) {
    const audit = audits[ref.id];
    if (!audit || !OTHER_GROUPS.has(ref.group ?? "") || ref.id in OPPORTUNITIES || NOT_OTHER.has(ref.id)) continue;
    if (isFailing(audit) && savingsMs(audit) > 0) add("performance.other", finding(ref.id, audit));
  }

  const ranked = [...failing.entries()]
    .map(([id, findings]) => ({
      id,
      findings: findings.sort((a, b) => b.savingsMs - a.savingsMs),
      savingsMs: Math.max(...findings.map((f) => f.savingsMs)),
    }))
    // Specific advice beats the fallback when savings tie.
    .sort((a, b) => b.savingsMs - a.savingsMs || Number(a.id === "performance.other") - Number(b.id === "performance.other"))
    .slice(0, MAX_OPPORTUNITIES);

  const issues = ranked.map(({ id, findings, savingsMs: best }) =>
    makeIssue(id, false, {
      estimatedSavingsMs: best,
      audits: findings.map(({ id: auditId, title, displayValue, savingsMs }) => ({ id: auditId, title, displayValue, savingsMs })),
      urls: [...new Set(findings.flatMap((f) => f.urls))].slice(0, MAX_URLS),
    }),
  );
  // Report a pass only when PSI actually measured it and nothing failed (not when it was cut by the limit).
  for (const id of seen) {
    if (!failing.has(id)) issues.push(makeIssue(id, true));
  }
  return issues;
}

/**
 * Maps a parsed PSI response to issues and category scores. Pure: no I/O.
 * Expects a successful run; the client rejects runtime errors and missing performance scores.
 */
export function mapPsiResult(response: PsiResponse): PsiResult {
  const { categories, lighthouseVersion } = response.lighthouseResult;
  return {
    issues: [...metricIssues(response), ...opportunityIssues(response)],
    scores: {
      performance: toScore(categories.performance.score) ?? 0,
      accessibility: toScore(categories.accessibility?.score),
      seo: toScore(categories.seo?.score),
      bestPractices: toScore(categories["best-practices"]?.score),
    },
    lighthouseVersion,
  };
}
