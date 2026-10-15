import { checkRegistry, type CheckId } from "@/lib/checks/registry";
import type { AppLocale } from "@/i18n/routing";
import type { Platform } from "@/lib/schemas";
import { ar } from "./ar";
import { en } from "./en";
import { fr } from "./fr";
import { shared } from "./shared";
import type { KbEntry, KbLocale } from "./types";

export const kbByLocale: Record<AppLocale, KbLocale> = { en, fr, ar };

/** Used for ids with no entry of their own, e.g. a PageSpeed audit we haven't mapped yet. */
export const FALLBACK_ID: CheckId = "performance.other";

function isCheckId(id: string): id is CheckId {
  return Object.hasOwn(checkRegistry, id);
}

/**
 * Joins report content at render time: stored reports hold only issue ids, so switching
 * language needs no re-audit. `platformFix` is added next to the generic `fix`, never in place of it.
 */
export function getKbEntry(locale: AppLocale, id: string, platform: Platform = "unknown"): KbEntry {
  const known = isCheckId(id);
  const key = known ? id : FALLBACK_ID;
  const { platformFixes, ...text } = kbByLocale[locale][key];
  const platformFix = platform === "unknown" ? undefined : platformFixes?.[platform];

  return {
    id,
    ...text,
    ...(platformFixes ? { platformFixes } : {}),
    ...shared[key],
    ...(platformFix ? { platformFix } : {}),
    isFallback: !known,
  };
}

export type { KbEntry } from "./types";
