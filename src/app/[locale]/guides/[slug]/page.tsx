import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Code, Wrench } from "lucide-react";
import { areaIcons } from "@/components/areaIcons";
import { JsonLd } from "@/components/JsonLd";
import { SeverityBadge } from "@/components/report/SeverityBadge";
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
  const definition = checkRegistry[id];
  const area = "local" in definition && definition.local ? "local" : definition.category;
  const AreaIcon = areaIcons[area];
  const url = localeUrl(locale, `/guides/${slug}`);

  const sections = [
    { id: "what", label: t("whatTitle") },
    { id: "why", label: t("whyTitle") },
    { id: "fix", label: t("fixTitle") },
    ...(platforms.length > 0 ? [{ id: "platforms", label: t("platformsTitle") }] : []),
    ...(entry.snippet ? [{ id: "developer", label: t("devTitle") }] : []),
  ];

  // Rendered twice (inline on small screens, in the sidebar on wide ones), so each copy gets its own id.
  const cta = (ctaId: string) => (
    <section aria-labelledby={ctaId} className="bg-primary text-primary-foreground relative isolate overflow-hidden rounded-3xl p-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-25 [background:radial-gradient(80%_70%_at_100%_0%,white,transparent)]" />
      <h2 id={ctaId} className="text-lg font-semibold">
        {t("ctaTitle")}
      </h2>
      <p className="mt-2 text-sm opacity-90">{t("ctaBody")}</p>
      <Link
        href="/"
        className="bg-background text-foreground focus-visible:ring-background/50 mt-5 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-soft outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-3"
      >
        {t("ctaButton")}
        <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
      </Link>
    </section>
  );

  return (
    <main className="flex flex-1 flex-col">
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

      {/* Hero band */}
      <header className="relative isolate overflow-hidden border-b">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="bg-grid absolute inset-0" />
          <div className="bg-glow absolute -top-56 -end-40 h-[480px] w-[720px] opacity-60" />
        </div>
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
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
              <li aria-current="page" className="text-foreground line-clamp-1">
                {entry.title}
              </li>
            </ol>
          </nav>
          <div className="flex max-w-3xl flex-col gap-4">
            <p className="text-primary flex items-center gap-2 text-sm font-semibold">
              <AreaIcon aria-hidden="true" className="size-4" />
              {t("eyebrow")} · {t(`groups.${area}`)}
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{entry.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={definition.severity} label={tReport(`severity.${definition.severity}`)} />
              <span className="bg-card text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs font-medium">{tReport(`impact.${entry.impact}`)}</span>
              <span className="bg-card text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs font-medium">{tReport(`effort.${entry.effort}`)}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="flex min-w-0 flex-col gap-10">
          <section aria-labelledby="what" className="flex flex-col gap-3">
            <h2 id="what" className="text-2xl font-semibold tracking-tight">
              {t("whatTitle")}
            </h2>
            <p className="text-lg">{entry.what}</p>
          </section>

          <section aria-labelledby="why" className="flex flex-col gap-3">
            <h2 id="why" className="text-2xl font-semibold tracking-tight">
              {t("whyTitle")}
            </h2>
            <p className="text-muted-foreground text-lg">{entry.why}</p>
            <p className="border-primary/30 bg-primary/5 rounded-2xl border p-4 text-lg font-medium">{entry.businessImpact}</p>
          </section>

          <section aria-labelledby="fix" className="flex flex-col gap-3">
            <h2 id="fix" className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Wrench aria-hidden="true" className="text-primary size-5" />
              {t("fixTitle")}
            </h2>
            <p className="text-lg">{entry.fix}</p>
          </section>

          {platforms.length > 0 && (
            <section aria-labelledby="platforms" className="flex flex-col gap-4">
              <h2 id="platforms" className="text-2xl font-semibold tracking-tight">
                {t("platformsTitle")}
              </h2>
              <div className="grid gap-3">
                {platforms.map((platform) => (
                  <div key={platform} className="bg-card shadow-soft flex flex-col gap-2 rounded-2xl border p-5">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <span aria-hidden="true" className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg text-xs font-bold">
                        {platformNames[platform].charAt(0)}
                      </span>
                      {platformNames[platform]}
                    </h3>
                    <p>{entry.platformFixes?.[platform]}</p>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-sm">{t("platformsNote")}</p>
            </section>
          )}

          {entry.snippet && (
            <section aria-labelledby="developer" className="flex flex-col gap-3">
              <h2 id="developer" className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                <Code aria-hidden="true" className="text-primary size-5" />
                {t("devTitle")}
              </h2>
              <p className="text-muted-foreground">{t("devIntro")}</p>
              <pre dir="ltr" className="bg-muted/60 overflow-auto rounded-2xl border p-5 text-start font-mono text-sm leading-relaxed">
                <code>{entry.snippet}</code>
              </pre>
            </section>
          )}

          {/* On small screens the call to action follows the article. */}
          <div className="lg:hidden">{cta("cta-inline")}</div>

          <section aria-labelledby="related" className="flex flex-col gap-4 border-t pt-10">
            <h2 id="related" className="text-2xl font-semibold tracking-tight">
              {t("relatedTitle")}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {relatedGuides(id).map((relatedId) => (
                <li key={relatedId}>
                  <Link
                    href={`/guides/${guideSlugs[relatedId]}`}
                    className="bg-card shadow-soft hover:border-primary/40 group flex h-full items-center justify-between gap-3 rounded-2xl border p-5 font-medium transition-colors"
                  >
                    {getKbEntry(locale, relatedId).title}
                    <ArrowRight aria-hidden="true" className="text-muted-foreground group-hover:text-primary size-4 shrink-0 transition-colors rtl:-scale-x-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-6">
            <nav aria-label={t("onThisPage")} className="flex flex-col gap-3">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{t("onThisPage")}</p>
              <ul className="flex flex-col gap-0.5 border-s">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-muted-foreground hover:text-foreground hover:border-primary -ms-px block border-s-2 border-transparent py-1.5 ps-4 text-sm transition-colors"
                    >
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            {cta("cta-sidebar")}
          </div>
        </aside>
      </div>
    </main>
  );
}
