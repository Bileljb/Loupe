import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { auditErrorCodes } from "@/lib/audit/events";
import en from "./en.json";
import fr from "./fr.json";
import ar from "./ar.json";

const messagesByLocale: Record<string, unknown> = { en, fr, ar };

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("messages", () => {
  const englishKeys = flattenKeys(en).sort();

  it.each(routing.locales)("%s has a messages file", (locale) => {
    expect(messagesByLocale[locale]).toBeDefined();
  });

  it.each(routing.locales)("%s has exactly the same keys as English", (locale) => {
    expect(flattenKeys(messagesByLocale[locale]).sort()).toEqual(englishKeys);
  });

  it.each(auditErrorCodes)("has a friendly message for error code %s", (code) => {
    expect(englishKeys).toContain(`Errors.${code}`);
  });
});
