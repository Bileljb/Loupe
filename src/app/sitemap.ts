import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { alternates, indexablePaths, localeUrl } from "@/lib/seo";

/** Every indexable page in every language, with hreflang alternates. Never reports. */
export default function sitemap(): MetadataRoute.Sitemap {
  return indexablePaths().flatMap((path) =>
    routing.locales.map((locale) => ({
      url: localeUrl(locale, path),
      changeFrequency: path === "/" ? "weekly" : "monthly",
      priority: path === "/" ? 1 : path === "/guides" ? 0.8 : 0.6,
      alternates: { languages: alternates(locale, path).languages as Record<string, string> },
    })),
  );
}
