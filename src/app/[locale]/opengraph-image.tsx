import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { ogSize, renderOgImage } from "@/lib/og";
import { siteConfig } from "@/lib/siteConfig";

export const size = ogSize;
export const contentType = "image/png";
export const alt = siteConfig.name;

/** Social card for the landing page (and default for pages below it), in the page's language. */
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: requested } = await params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "HomePage" });
  const tSite = await getTranslations({ locale, namespace: "Site" });
  return renderOgImage({ locale, eyebrow: tSite("tagline"), title: t("title"), footer: t("trust") });
}
