import { randomBytes } from "node:crypto";
import { runHtmlChecks, type PageSnapshot, type SiteFile } from "@/lib/checks";
import { mapPsiResult, type PsiResult } from "@/lib/checks/psi";
import { auditInputSchema, reportSchema, type AuditInput, type Issue, type Report } from "@/lib/schemas";
import { computeScores, sortIssues } from "@/lib/scoring/score";
import { FetchError, fetchErrorCodes, type FetchErrorCode } from "@/lib/security/errors";
import { safeFetch } from "@/lib/security/safeFetch";
import { validateUrl } from "@/lib/security/ssrf";
import { fetchPsi } from "./psiClient";

/** Progress events for the streamed API response. Stages run in parallel, so order isn't fixed. */
export type AuditProgress =
  | { type: "started"; stages: AuditStage[] }
  | { type: "stage"; stage: AuditStage; status: "done" | "failed" };
export type AuditStage = "performance" | "page";

export type AuditDeps = {
  validate: (url: URL) => Promise<unknown>;
  fetchSnapshot: (url: string) => Promise<PageSnapshot>;
  runPsi: (url: string) => Promise<PsiResult>;
  now: () => Date;
  newId: () => string;
};

export type AuditOptions = {
  previousReportId?: string;
  onProgress?: (event: AuditProgress) => void;
  deps?: Partial<AuditDeps>;
};

/** 16 url-safe chars from 96 random bits: unguessable, short enough for a link. */
export function newReportId(): string {
  return randomBytes(12).toString("base64url");
}

async function fetchSiteFile(url: URL, kind: "robots" | "sitemap"): Promise<SiteFile> {
  try {
    const result = await safeFetch(url, { kind });
    return { status: result.status, body: result.body };
  } catch {
    // Missing or refused site files are a finding, not a failure.
    return null;
  }
}

/** Fetches the homepage, then robots.txt and sitemap.xml from the final origin. Never crawls further. */
export async function fetchSnapshot(url: string): Promise<PageSnapshot> {
  const page = await safeFetch(url, { kind: "html" });
  const origin = new URL(page.url).origin;
  const [robotsTxt, sitemap] = await Promise.all([
    fetchSiteFile(new URL("/robots.txt", origin), "robots"),
    fetchSiteFile(new URL("/sitemap.xml", origin), "sitemap"),
  ]);
  return {
    finalUrl: page.url,
    status: page.status,
    headers: page.headers,
    redirects: page.redirects,
    html: page.body,
    robotsTxt,
    sitemap,
  };
}

const defaultDeps: AuditDeps = {
  validate: (url) => validateUrl(url),
  fetchSnapshot,
  runPsi: async (url) => mapPsiResult(await fetchPsi(url)),
  now: () => new Date(),
  newId: newReportId,
};

function isFetchErrorCode(value: string): value is FetchErrorCode {
  return (fetchErrorCodes as readonly string[]).includes(value);
}

/** Validates and normalizes request input. Throws FetchError with a translatable code. */
export function parseAuditInput(input: { url: string; localChecks?: boolean }): AuditInput {
  const parsed = auditInputSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "";
    throw new FetchError(isFetchErrorCode(message) ? message : "INVALID_URL");
  }
  return parsed.data;
}

/** One issue per id. If two sources report the same id, a failure wins over a pass. */
export function mergeIssues(...sources: Issue[][]): Issue[] {
  const byId = new Map<string, Issue>();
  for (const issue of sources.flat()) {
    const existing = byId.get(issue.id);
    if (!existing || (existing.passed && !issue.passed)) byId.set(issue.id, issue);
  }
  return [...byId.values()];
}

/**
 * The single audit entry point (API route today, maybe a queue worker later).
 * Runs PSI and the page checks in parallel and returns whatever succeeded, flagged as partial.
 * Throws FetchError only when the URL is invalid or blocked, or when both sources fail.
 */
export async function runAudit(
  input: { url: string; localChecks?: boolean },
  options: AuditOptions = {},
): Promise<Report> {
  const deps = { ...defaultDeps, ...options.deps };
  const emit = options.onProgress ?? (() => {});

  const { url, localChecks } = parseAuditInput(input);

  // Reject private and reserved addresses before anything (including Google) is asked to visit them.
  await deps.validate(new URL(url));

  emit({ type: "started", stages: ["performance", "page"] });
  const track = <T>(stage: AuditStage, promise: Promise<T>) =>
    promise.then(
      (value) => {
        emit({ type: "stage", stage, status: "done" });
        return value;
      },
      (error: unknown) => {
        emit({ type: "stage", stage, status: "failed" });
        throw error;
      },
    );

  const [psiOutcome, pageOutcome] = await Promise.allSettled([
    track("performance", deps.runPsi(url)),
    track("page", deps.fetchSnapshot(url).then((snapshot) => runHtmlChecks(snapshot, { localChecks }))),
  ]);

  if (psiOutcome.status === "rejected" && pageOutcome.status === "rejected") {
    // The page error says more to the owner (blocked, timeout, not a web page...) than PSI's.
    const error: unknown = pageOutcome.reason;
    throw error instanceof FetchError ? error : new FetchError("UNREACHABLE", { cause: error });
  }

  const psi = psiOutcome.status === "fulfilled" ? psiOutcome.value : null;
  const page = pageOutcome.status === "fulfilled" ? pageOutcome.value : null;
  const issues = sortIssues(mergeIssues(psi?.issues ?? [], page?.issues ?? []));

  const partial: NonNullable<Report["partial"]> = {
    ...(psi ? {} : { psiFailed: true }),
    ...(page ? {} : { htmlFailed: true }),
    ...(page?.jsShellSuspected ? { jsShellSuspected: true } : {}),
  };

  const report: Report = {
    schemaVersion: 1,
    id: deps.newId(),
    url,
    createdAt: deps.now().toISOString(),
    scores: computeScores({ issues, psi: psi?.scores ?? null, htmlChecked: page !== null }),
    issues,
    ...(Object.keys(partial).length ? { partial } : {}),
    ...(page ? { platform: page.platform } : {}),
    localChecks,
    ...(options.previousReportId ? { previousReportId: options.previousReportId } : {}),
  };
  // Our own output must satisfy the schema we validate stored reports against.
  return reportSchema.parse(report);
}
