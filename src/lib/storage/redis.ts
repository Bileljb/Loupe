import { Redis } from "@upstash/redis";
import type { KeyValueStore } from "./reports";

/** The only file that knows about Upstash. Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN. */
export function createRedisStore(): KeyValueStore {
  // The client JSON-encodes on set and decodes on get; callers validate what comes back.
  const redis = Redis.fromEnv();
  return {
    async get(key) {
      return redis.get<unknown>(key);
    },
    async set(key, value, ttlSeconds) {
      await redis.set(key, value, { ex: ttlSeconds });
    },
  };
}
