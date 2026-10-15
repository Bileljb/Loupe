import type { CheckId } from "@/lib/checks/registry";
import type { Platform } from "@/lib/schemas";

export type Level = "low" | "medium" | "high";
export type KnownPlatform = Exclude<Platform, "unknown">;

/**
 * Translated, owner-facing text (Layer 1). Must pass the jargon test: technical detail
 * belongs in the shared `snippet` or in issue evidence, never here.
 */
export type KbText = {
  title: string;
  what: string;
  why: string; // the problem in plain words
  businessImpact: string; // the consequence for the business, never a raw metric
  fix: string; // generic fix; always shown when there is no platform-specific one
  platformFixes?: Partial<Record<KnownPlatform, string>>;
};

/** Language-neutral fields, written once so locales can't drift apart. */
export type KbShared = {
  effort: Level;
  impact: Level;
  snippet?: string; // Layer 2 (developer details); never translated
};

export type KbLocale = Record<CheckId, KbText>;
export type KbSharedTable = Record<CheckId, KbShared>;

export type KbEntry = KbText &
  KbShared & {
    id: string;
    /** Steps for the detected platform, shown in addition to (never instead of) `fix`. */
    platformFix?: string;
    /** True when the id has no entry of its own and the generic fallback was used. */
    isFallback: boolean;
  };
