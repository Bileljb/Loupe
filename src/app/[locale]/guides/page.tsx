import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-12 text-start sm:px-6">
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
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{t("indexTitle")}</h1>
        <p className="text-muted-foreground text-lg">{t("indexIntro")}</p>
      </div>

      {guideGroups().map((group) => (
        <section key={group.key} aria-labelledby={`group-${group.key}`} className="flex flex-col gap-3">
          <h2 id={`group-${group.key}`} className="text-xl font-semibold">
            {t(`groups.${group.key}`)}
          </h2>
          <ul className="flex flex-col gap-2">
            {group.ids.map((id) => {
              const entry = getKbEntry(locale, id);
              return (
                <li key={id}>
                  <Link
                    href={`/guides/${guideSlugs[id]}`}
                    className="bg-card hover:border-primary/50 flex flex-col gap-1 rounded-xl border p-4"
                  >
                    <span className="font-medium">{entry.title}</span>
                    <span className="text-muted-foreground text-sm">{entry.what}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
