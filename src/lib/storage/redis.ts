import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logEvent } from "@/lib/log";
import type { Limiter } from "@/lib/security/rateLimit";
import type { KeyValueStore } from "./reports";

// The only file that knows about Upstash. Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
let client: Redis | null = null;
function redis(): Redis {
  client ??= Redis.fromEnv();
  return client;
}

export function createRedisStore(): KeyValueStore {
  // The client JSON-encodes on set and decodes on get; callers validate what comes back.
  return {
    async get(key) {
      return redis().get<unknown>(key);
    },
    async set(key, value, ttlSeconds) {
      await redis().set(key, value, { ex: ttlSeconds });
    },
  };
}

type LimiterConfig = {
  name: string;
  limit: number;
  /** "sliding" for per-visitor limits; "fixed" for a daily budget that resets at midnight UTC. */
  kind: "sliding" | "fixed";
  window: "1 h" | "1 d";
};

/** Fails open: if Redis can't answer, the request is allowed rather than blocking every visitor. */
export function createRedisLimiter({ name, limit, kind, window }: LimiterConfig): Limiter {
  const ratelimit = new Ratelimit({
    redis: redis(),
    limiter: kind === "sliding" ? Ratelimit.slidingWindow(limit, window) : Ratelimit.fixedWindow(limit, window),
    prefix: `ratelimit:${name}`,
    timeout: 3000,
    analytics: false,
  });
  return {
    async check(key) {
      try {
        const { success, reset } = await ratelimit.limit(key);
        return { allowed: success, resetAt: reset };
      } catch (error) {
        logEvent("warn", "ratelimit.unavailable", { limiter: name, error: error instanceof Error ? error.name : "unknown" });
        return { allowed: true, resetAt: Date.now() };
      }
    },
  };
}
