import { auditsPerHour, psiDailyCap, type Limiter } from "@/lib/security/rateLimit";
import { createRedisLimiter } from "@/lib/storage/redis";

let audits: Limiter | null = null;
let psi: Limiter | null = null;

/** Audits (including re-scans) per visitor: a sliding window of AUDITS_PER_HOUR. */
export function auditLimiter(): Limiter {
  audits ??= createRedisLimiter({ name: "audits", limit: auditsPerHour(), kind: "sliding", window: "1 h" });
  return audits;
}

/** Global PSI budget: PSI_DAILY_CAP calls per day for the whole app. Cached audits don't spend it. */
export function psiLimiter(): Limiter {
  psi ??= createRedisLimiter({ name: "psi-daily", limit: psiDailyCap(), kind: "fixed", window: "1 d" });
  return psi;
}
