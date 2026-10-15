import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr", "ar"],
  defaultLocale: "en",
  // Language always lives in the URL (/en, /fr, /ar); each locale URL is reachable directly.
  localePrefix: "always",
  // Accept-Language is only consulted when no NEXT_LOCALE cookie exists (first visit).
  localeDetection: true,
  // Remember the user's choice for a year instead of a session cookie.
  localeCookie: { maxAge: 60 * 60 * 24 * 365 },
});

export type AppLocale = (typeof routing.locales)[number];

/** Display names are always shown in their own language. */
export const localeNames: Record<AppLocale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

const rtlLocales: ReadonlySet<AppLocale> = new Set(["ar"]);

export function getDirection(locale: AppLocale): "ltr" | "rtl" {
  return rtlLocales.has(locale) ? "rtl" : "ltr";
}
