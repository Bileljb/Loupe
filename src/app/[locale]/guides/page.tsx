import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, BookOpen } from "lucide-react";
import { areaIcons } from "@/components/areaIcons";
import { JsonLd } from "@/components/JsonLd";
import { Link } from "@/i18n/navigation";
import { getKbEntry } from "@/lib/kb";
import { guideGroups, guideSlugs } from "@/lib/guides";
import { localeUrl, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Metadata");
  return pageMetadata({ locale, path: "/guides", title: t("guidesTitle"), description: t("guidesDescription") });
}

export default function GuidesIndexPage() {
  const locale = useLocale();
  const t = useTranslations("Guides");
  const tNav = useTranslations("Nav");

  return (
    <main className="flex flex-1 flex-col">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: tNav("home"), item: localeUrl(locale, "/") },
            { "@type": "ListItem", position: 2, name: tNav("guides"), item: localeUrl(locale, "/guides") },
          ],
        }}
      />

      <section className="relative isolate overflow-hidden border-b">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="bg-grid absolute inset-0" />
          <div className="bg-glow absolute inset-x-0 -top-48 mx-auto h-[480px] w-[820px] max-w-[160vw] opacity-70" />
        </div>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 sm:py-20">
          <span className="bg-card/80 text-primary shadow-soft flex size-12 items-center justify-center rounded-2xl border">
            <BookOpen aria-hidden="true" className="size-6" />
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t("indexTitle")}</h1>
          <p className="text-muted-foreground text-lg">{t("indexIntro")}</p>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6">
        {guideGroups().map((group) => {
          const Icon = areaIcons[group.key];
          return (
            <section key={group.key} aria-labelledby={`group-${group.key}`} className="reveal flex flex-col gap-6">
              <h2 id={`group-${group.key}`} className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
                <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                {t(`groups.${group.key}`)}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.ids.map((id) => {
                  const entry = getKbEntry(locale, id);
                  return (
                    <li key={id}>
                      <Link
                        href={`/guides/${guideSlugs[id]}`}
                        className="bg-card shadow-soft hover:border-primary/40 group flex h-full flex-col gap-2 rounded-2xl border p-5 transition-colors"
                      >
                        <span className="flex items-start justify-between gap-3 font-semibold">
                          {entry.title}
                          <ArrowRight
                            aria-hidden="true"
                            className="text-muted-foreground group-hover:text-primary mt-1 size-4 shrink-0 transition-colors rtl:-scale-x-100"
                          />
                        </span>
                        <span className="text-muted-foreground line-clamp-2 text-sm">{entry.what}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
