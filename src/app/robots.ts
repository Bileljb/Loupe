import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/lib/siteConfig";

/** Public pages are open; the API and the (noindex, expiring) report pages are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", ...routing.locales.map((locale) => `/${locale}/report/`)],
    },
    sitemap: new URL("/sitemap.xml", siteConfig.url).toString(),
  };
}
