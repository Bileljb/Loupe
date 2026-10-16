import { createHash } from "node:crypto";
import { reportSchema, type Report } from "@/lib/schemas";
import { createRedisStore } from "./redis";

/**
 * The minimal store the report logic needs. Only storage/redis.ts implements it with Upstash;
 * tests use an in-memory version. Values are JSON-serializable.
 */
export type KeyValueStore = {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
};

export type GetReportResult =
  | { status: "found"; report: Report }
  | { status: "not_found" }
  // Saved by a newer or retired schema. Old links must show a friendly page, never crash.
  | { status: "unsupported_version" };

export type ReportStorage = {
  saveReport(report: Report): Promise<void>;
  getReport(id: string): Promise<GetReportResult>;
  getCachedReportId(url: string, localChecks: boolean): Promise<string | null>;
  setCachedReportId(url: string, localChecks: boolean, id: string): Promise<void>;
};

export const DEFAULT_REPORT_TTL_DAYS = 30;
const DAY_SECONDS = 60 * 60 * 24;
// Short on purpose: it only protects PSI quota from repeated audits of the same page.
export const CACHE_TTL_SECONDS = 60 * 60;

// newReportId makes 16 url-safe chars; anything else can't be ours, so skip the lookup.
const REPORT_ID_PATTERN = /^[A-Za-z0-9_-]{12,64}$/;

export function reportTtlDays(value = process.env.REPORT_TTL_DAYS): number {
  const days = Number(value);
  return Number.isInteger(days) && days > 0 ? days : DEFAULT_REPORT_TTL_DAYS;
}

/** When the stored report disappears. Derived from createdAt, so no extra field or Redis call. */
export function reportExpiresAt(report: Pick<Report, "createdAt">, ttlDays = reportTtlDays()): Date {
  return new Date(Date.parse(report.createdAt) + ttlDays * DAY_SECONDS * 1000);
}

export function reportKey(id: string): string {
  return `report:${id}`;
}

/** Reports are language-neutral, so the language is deliberately not part of the key. */
export function cacheKey(url: string, localChecks: boolean): string {
  const hash = createHash("sha256").update(`${url}\n${localChecks ? "local" : "standard"}`).digest("hex");
  return `cache:${hash}`;
}

export function createReportStorage(
  store: KeyValueStore,
  ttlDays: number = reportTtlDays(),
): ReportStorage {
  return {
    async saveReport(report) {
      await store.set(reportKey(report.id), report, ttlDays * DAY_SECONDS);
    },

    async getReport(id) {
      if (!REPORT_ID_PATTERN.test(id)) return { status: "not_found" };
      const stored = await store.get(reportKey(id));
      if (typeof stored !== "object" || stored === null) return { status: "not_found" };

      const version = (stored as { schemaVersion?: unknown }).schemaVersion;
      if (version !== 1) return { status: "unsupported_version" };

      const parsed = reportSchema.safeParse(stored);
      // A damaged entry is treated like a missing one rather than shown half-broken.
      return parsed.success ? { status: "found", report: parsed.data } : { status: "not_found" };
    },

    async getCachedReportId(url, localChecks) {
      const id = await store.get(cacheKey(url, localChecks));
      return typeof id === "string" && REPORT_ID_PATTERN.test(id) ? id : null;
    },

    async setCachedReportId(url, localChecks, id) {
      await store.set(cacheKey(url, localChecks), id, CACHE_TTL_SECONDS);
    },
  };
}

let defaultStorage: ReportStorage | null = null;

/** The app's storage, backed by Upstash. Created on first use so tests and builds never need Redis. */
export function getReportStorage(): ReportStorage {
  defaultStorage ??= createReportStorage(createRedisStore());
  return defaultStorage;
}

/** For tests and local experiments. Honors TTLs against an injectable clock. */
export function createMemoryStore(now: () => number = Date.now): KeyValueStore {
  const entries = new Map<string, { value: string; expiresAt: number }>();
  return {
    async get(key) {
      const entry = entries.get(key);
      if (!entry || entry.expiresAt <= now()) return null;
      return JSON.parse(entry.value) as unknown;
    },
    async set(key, value, ttlSeconds) {
      // Stored as JSON like Redis, so tests can't depend on object identity.
      entries.set(key, { value: JSON.stringify(value), expiresAt: now() + ttlSeconds * 1000 });
    },
  };
}
