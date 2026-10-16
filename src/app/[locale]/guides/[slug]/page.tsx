import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { SeverityBadge } from "@/components/report/SeverityBadge";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { checkRegistry } from "@/lib/checks/registry";
import { getKbEntry } from "@/lib/kb";
import type { KnownPlatform } from "@/lib/kb/types";
import { guideIdForSlug, guideIds, guideSlugs, relatedGuides } from "@/lib/guides";
import { platformNames } from "@/lib/report";
import { clip, localeUrl, pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/siteConfig";

// Every guide is prerendered at build time; an unknown slug renders the 404 page.
export function generateStaticParams() {
  return guideIds.map((id) => ({ slug: guideSlugs[id] }));
}

const PLATFORM_ORDER: KnownPlatform[] = ["wordpress", "wix", "shopify", "squarespace", "webflow"];

export async function generateMetadata({ params }: PageProps<"/[locale]/guides/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const id = guideIdForSlug(slug);
  if (!id) return {};
  const locale = await getLocale();
  const entry = getKbEntry(locale, id);
  return pageMetadata({
    locale,
    path: `/guides/${slug}`,
    title: entry.title,
    description: clip(`${entry.what} ${entry.fix}`),
    type: "article",
    // No "| Loupe" suffix: keeps guide titles under ~60 characters (the brand is in og:site_name).
    absoluteTitle: true,
  });
}

export default async function GuidePage({ params }: PageProps<"/[locale]/guides/[slug]">) {
  const { slug } = await params;
  const id = guideIdForSlug(slug);
  if (!id) notFound();

  const locale = await getLocale();
  const t = await getTranslations("Guides");
  const tNav = await getTranslations("Nav");
  const tReport = await getTranslations("Report");
  const entry = getKbEntry(locale, id);
  const platforms = PLATFORM_ORDER.filter((platform) => entry.platformFixes?.[platform]);
  const severity = checkRegistry[id].severity;
  const url = localeUrl(locale, `/guides/${slug}`);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-12 text-start sm:px-6">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: entry.title,
            description: clip(`${entry.what} ${entry.fix}`),
            inLanguage: locale,
            url,
            mainEntityOfPage: url,
            author: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
            publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: tNav("home"), item: localeUrl(locale, "/") },
              { "@type": "ListItem", position: 2, name: tNav("guides"), item: localeUrl(locale, "/guides") },
              { "@type": "ListItem", position: 3, name: entry.title, item: url },
            ],
          },
        ]}
      />

      <nav aria-label={t("breadcrumbLabel")} className="text-muted-foreground text-sm">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-foreground underline-offset-4 hover:underline">
              {tNav("home")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/guides" className="hover:text-foreground underline-offset-4 hover:underline">
              {tNav("guides")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            {entry.title}
          </li>
        </ol>
      </nav>

      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="text-primary text-sm font-semibold">{t("eyebrow")}</p>
          <h1 className="text-3xl font-bold tracking-tight">{entry.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={severity} label={tReport(`severity.${severity}`)} />
            <span className="bg-muted rounded-full px-2 py-0.5 text-xs">{tReport(`impact.${entry.impact}`)}</span>
            <span className="bg-muted rounded-full px-2 py-0.5 text-xs">{tReport(`effort.${entry.effort}`)}</span>
          </div>
        </header>

        <section aria-labelledby="what" className="flex flex-col gap-2">
          <h2 id="what" className="text-xl font-semibold">
            {t("whatTitle")}
          </h2>
          <p className="text-lg">{entry.what}</p>
        </section>

        <section aria-labelledby="why" className="flex flex-col gap-2">
          <h2 id="why" className="text-xl font-semibold">
            {t("whyTitle")}
          </h2>
          <p>{entry.why}</p>
          <p className="font-medium">{entry.businessImpact}</p>
        </section>

        <section aria-labelledby="fix" className="flex flex-col gap-2">
          <h2 id="fix" className="text-xl font-semibold">
            {t("fixTitle")}
          </h2>
          <p>{entry.fix}</p>
        </section>

        {platforms.length > 0 && (
          <section aria-labelledby="platforms" className="flex flex-col gap-3">
            <h2 id="platforms" className="text-xl font-semibold">
              {t("platformsTitle")}
            </h2>
            {platforms.map((platform) => (
              <div key={platform} className="border-primary/40 bg-primary/5 flex flex-col gap-1 rounded-lg border-s-4 p-4">
                <h3 className="font-semibold">{platformNames[platform]}</h3>
                <p>{entry.platformFixes?.[platform]}</p>
              </div>
            ))}
            <p className="text-muted-foreground text-sm">{t("platformsNote")}</p>
          </section>
        )}

        {entry.snippet && (
          <section aria-labelledby="developer" className="flex flex-col gap-2">
            <h2 id="developer" className="text-xl font-semibold">
              {t("devTitle")}
            </h2>
            <p className="text-muted-foreground">{t("devIntro")}</p>
            <pre dir="ltr" className="bg-muted/60 overflow-auto rounded-md p-4 text-start font-mono text-sm">
              <code>{entry.snippet}</code>
            </pre>
          </section>
        )}
      </article>

      <section aria-labelledby="cta" className="border-primary/30 bg-primary/5 flex flex-col items-start gap-3 rounded-2xl border p-6">
        <h2 id="cta" className="text-xl font-semibold">
          {t("ctaTitle")}
        </h2>
        <p className="text-muted-foreground">{t("ctaBody")}</p>
        <Link href="/" className={buttonVariants({ size: "lg" })}>
          {t("ctaButton")}
        </Link>
      </section>

      <section aria-labelledby="related" className="flex flex-col gap-3">
        <h2 id="related" className="text-xl font-semibold">
          {t("relatedTitle")}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {relatedGuides(id).map((relatedId) => (
            <li key={relatedId}>
              <Link
                href={`/guides/${guideSlugs[relatedId]}`}
                className="bg-card hover:border-primary/50 flex h-full items-center justify-between gap-3 rounded-xl border p-4 font-medium"
              >
                {getKbEntry(locale, relatedId).title}
                <ArrowRight aria-hidden="true" className="text-muted-foreground size-4 shrink-0 rtl:-scale-x-100" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
