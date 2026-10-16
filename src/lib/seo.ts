import type { Metadata } from "next";
import { routing, type AppLocale } from "@/i18n/routing";
import { guideIds, guideSlugs } from "@/lib/guides";
import { siteConfig } from "@/lib/siteConfig";

/** Open Graph locale codes. */
export const ogLocales: Record<AppLocale, string> = { en: "en_US", fr: "fr_FR", ar: "ar_AR" };

/** Path without a locale prefix ("/", "/guides/missing-sitemap") -> absolute URL for a locale. */
export function localeUrl(locale: AppLocale, path: string): string {
  const suffix = path === "/" ? "" : path;
  return new URL(`/${locale}${suffix}`, siteConfig.url).toString();
}

/** Self-referencing canonical plus hreflang for every locale and x-default (English). */
export function alternates(locale: AppLocale, path: string): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((candidate) => [candidate, localeUrl(candidate, path)]),
  );
  languages["x-default"] = localeUrl(routing.defaultLocale, path);
  return { canonical: localeUrl(locale, path), languages };
}

type PageMetadataInput = {
  locale: AppLocale;
  path: string;
  title: string;
  description: string;
  /** Skip the "| Loupe" template (the landing page already names the brand). */
  absoluteTitle?: boolean;
  type?: "website" | "article";
};

/**
 * Complete metadata for an indexable page. Next.js replaces (not merges) openGraph and twitter
 * objects from parent layouts, so every page sets them in full here.
 */
export function pageMetadata({ locale, path, title, description, absoluteTitle = false, type = "website" }: PageMetadataInput): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: alternates(locale, path),
    openGraph: {
      type,
      siteName: siteConfig.name,
      title,
      description,
      url: localeUrl(locale, path),
      locale: ogLocales[locale],
      alternateLocale: routing.locales.filter((candidate) => candidate !== locale).map((candidate) => ogLocales[candidate]),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Public, indexable pages (paths without locale): landing, guides index and every guide. */
export function indexablePaths(): string[] {
  return ["/", "/guides", ...guideIds.map((id) => `/guides/${guideSlugs[id]}`)];
}

/** Trims to about `max` characters at a word boundary, for meta descriptions. */
export function clip(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.]+$/, "")}…`;
}
