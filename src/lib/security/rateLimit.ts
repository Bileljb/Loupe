import { createHash } from "node:crypto";

export type LimitResult = {
  allowed: boolean;
  /** Unix time in ms when the window resets. */
  resetAt: number;
};

/** One limit (per IP, or global). The Upstash implementation lives in storage/redis.ts. */
export type Limiter = { check(key: string): Promise<LimitResult> };

export const DEFAULT_AUDITS_PER_HOUR = 5;
// Google's default PSI quota is 25,000 queries a day; stay far below it.
export const DEFAULT_PSI_DAILY_CAP = 1000;

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function auditsPerHour(value = process.env.AUDITS_PER_HOUR): number {
  return positiveInt(value, DEFAULT_AUDITS_PER_HOUR);
}

export function psiDailyCap(value = process.env.PSI_DAILY_CAP): number {
  return positiveInt(value, DEFAULT_PSI_DAILY_CAP);
}

/**
 * The visitor's IP, from the first X-Forwarded-For entry (set by Vercel's proxy) or X-Real-IP.
 * Hashed before use as a key, so Redis never holds raw IP addresses.
 */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || headers.get("x-real-ip")?.trim() || "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

/** Whole minutes until a reset, at least 1, for the "try again in X minutes" message. */
export function minutesUntil(resetAt: number, now = Date.now()): number {
  return Math.max(1, Math.ceil((resetAt - now) / 60_000));
}
