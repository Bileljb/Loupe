import { psiResponseSchema, type PsiResponse } from "@/lib/checks/psi";

// Only these codes leave this module; PSI error bodies are never passed on.
export type PsiErrorCode = "PSI_QUOTA" | "PSI_TIMEOUT" | "PSI_FAILED" | "PSI_INVALID_RESPONSE";

export class PsiError extends Error {
  readonly code: PsiErrorCode;

  constructor(code: PsiErrorCode, options?: { cause?: unknown }) {
    super(code, options);
    this.name = "PsiError";
    this.code = code;
  }
}

export type FetchPsiOptions = {
  apiKey?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

const ENDPOINT = "https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed";
const CATEGORIES = ["PERFORMANCE", "ACCESSIBILITY", "BEST_PRACTICES", "SEO"] as const;
// A mobile run takes 10-30s; leave headroom without outliving the function.
const DEFAULT_TIMEOUT_MS = 60_000;
const QUOTA_REASONS = new Set(["rateLimitExceeded", "dailyLimitExceeded", "userRateLimitExceeded", "quotaExceeded"]);

export function buildPsiUrl(url: string, apiKey?: string): string {
  const params = new URLSearchParams({ url, strategy: "MOBILE" });
  for (const category of CATEGORIES) params.append("category", category);
  if (apiKey) params.set("key", apiKey);
  return `${ENDPOINT}?${params}`;
}

async function isQuotaError(response: Response): Promise<boolean> {
  if (response.status === 429) return true;
  if (response.status !== 403) return false;
  try {
    const body: unknown = await response.json();
    const error = (body as { error?: { status?: unknown; errors?: { reason?: unknown }[] } }).error;
    return (
      error?.status === "RESOURCE_EXHAUSTED" ||
      (error?.errors ?? []).some((e) => typeof e.reason === "string" && QUOTA_REASONS.has(e.reason))
    );
  } catch {
    return false;
  }
}

/** Runs a mobile PageSpeed Insights audit. Throws PsiError; never exposes the key or upstream bodies. */
export async function fetchPsi(url: string, options: FetchPsiOptions = {}): Promise<PsiResponse> {
  const { apiKey = process.env.PSI_API_KEY, timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = fetch } = options;

  let response: Response;
  try {
    response = await fetchImpl(buildPsiUrl(url, apiKey), {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    throw new PsiError(name === "TimeoutError" || name === "AbortError" ? "PSI_TIMEOUT" : "PSI_FAILED");
  }

  if (!response.ok) {
    throw new PsiError((await isQuotaError(response)) ? "PSI_QUOTA" : "PSI_FAILED");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    throw new PsiError(name === "TimeoutError" || name === "AbortError" ? "PSI_TIMEOUT" : "PSI_INVALID_RESPONSE");
  }

  const parsed = psiResponseSchema.safeParse(body);
  if (!parsed.success) throw new PsiError("PSI_INVALID_RESPONSE", { cause: parsed.error });

  const { runtimeError, categories } = parsed.data.lighthouseResult;
  // Lighthouse can return 200 with a failed run (e.g. the page never painted).
  if ((runtimeError && runtimeError.code !== "NO_ERROR") || categories.performance.score === null) {
    throw new PsiError("PSI_FAILED");
  }
  return parsed.data;
}
