import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { guideIdForSlug } from "@/lib/guides";
import { getKbEntry } from "@/lib/kb";
import { ogSize, renderOgImage } from "@/lib/og";
import { siteConfig } from "@/lib/siteConfig";

export const size = ogSize;
export const contentType = "image/png";
export const alt = siteConfig.name;

/** Social card for one guide: its title in the page's language. */
export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: requested, slug } = await params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const id = guideIdForSlug(slug);
  const t = await getTranslations({ locale, namespace: "Guides" });
  const tSite = await getTranslations({ locale, namespace: "Site" });
  return renderOgImage({
    locale,
    eyebrow: t("eyebrow"),
    title: id ? getKbEntry(locale, id).title : t("indexTitle"),
    footer: tSite("tagline"),
  });
}
