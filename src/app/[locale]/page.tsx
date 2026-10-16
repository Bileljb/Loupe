import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, ChevronDown } from "lucide-react";
import { AuditForm } from "@/components/audit/AuditForm";
import { JsonLd } from "@/components/JsonLd";
import { Link } from "@/i18n/navigation";
import { getKbEntry } from "@/lib/kb";
import { guideSlugs, popularGuides } from "@/lib/guides";
import { EXAMPLE_REPORT_ID } from "@/lib/report";
import { localeUrl, pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/siteConfig";

const CHECK_AREAS = ["performance", "seo", "accessibility", "technical", "local"] as const;
const STEPS = ["step1", "step2", "step3"] as const;
const FAQ = ["free", "signup", "what", "full", "kept", "rescan"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Metadata");
  return pageMetadata({
    locale,
    path: "/",
    title: t("title", { name: siteConfig.name }),
    description: t("description"),
    absoluteTitle: true,
  });
}

export default function HomePage() {
  const locale = useLocale();
  const t = useTranslations("HomePage");
  const tSite = useTranslations("Site");
  const tMeta = useTranslations("Metadata");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-16 px-4 py-12 text-start sm:px-6 sm:py-16">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: siteConfig.name,
            url: localeUrl(locale, "/"),
            description: tMeta("description"),
            applicationCategory: "BusinessApplication",
            operatingSystem: "Any",
            inLanguage: locale,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            inLanguage: locale,
            mainEntity: FAQ.map((key) => ({
              "@type": "Question",
              name: t(`faq.${key}.q`),
              acceptedAnswer: { "@type": "Answer", text: t(`faq.${key}.a`) },
            })),
          },
        ]}
      />

      <section className="flex flex-col gap-8" aria-labelledby="hero-title">
        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">{tSite("tagline")}</p>
          <h1 id="hero-title" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-lg">{t("intro")}</p>
        </div>

        <AuditForm />

        <div className="text-muted-foreground flex flex-col gap-2 text-sm">
          <p>{t("scope")}</p>
          <p>{t("trust")}</p>
          <Link
            href={`/report/${EXAMPLE_REPORT_ID}`}
            className="text-primary inline-flex w-fit items-center gap-1 font-medium underline-offset-4 hover:underline"
          >
            {t("exampleLink")}
            <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          </Link>
        </div>
      </section>

      <section aria-labelledby="checks-title" className="flex flex-col gap-4">
        <h2 id="checks-title" className="text-2xl font-semibold">
          {t("checksTitle")}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {CHECK_AREAS.map((area) => (
            <li key={area} className="bg-card flex flex-col gap-1 rounded-xl border p-4">
              <h3 className="font-semibold">{t(`checks.${area}.title`)}</h3>
              <p className="text-muted-foreground">{t(`checks.${area}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-title" className="flex flex-col gap-4">
        <h2 id="how-title" className="text-2xl font-semibold">
          {t("howTitle")}
        </h2>
        <ol className="flex flex-col gap-3">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-start gap-4">
              <span aria-hidden="true" className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full font-bold">
                {index + 1}
              </span>
              <p className="pt-1">{t(`how.${step}`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="who-title" className="flex flex-col gap-3">
        <h2 id="who-title" className="text-2xl font-semibold">
          {t("whoTitle")}
        </h2>
        <p className="text-muted-foreground text-lg">{t("who")}</p>
      </section>

      <section aria-labelledby="guides-title" className="flex flex-col gap-4">
        <h2 id="guides-title" className="text-2xl font-semibold">
          {t("guidesTitle")}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {popularGuides.map((id) => (
            <li key={id}>
              <Link
                href={`/guides/${guideSlugs[id]}`}
                className="bg-card hover:border-primary/50 flex h-full items-center justify-between gap-3 rounded-xl border p-4 font-medium"
              >
                {getKbEntry(locale, id).title}
                <ArrowRight aria-hidden="true" className="text-muted-foreground size-4 shrink-0 rtl:-scale-x-100" />
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/guides" className="text-primary w-fit font-medium underline-offset-4 hover:underline">
          {t("guidesAll")}
        </Link>
      </section>

      <section aria-labelledby="faq-title" className="flex flex-col gap-4">
        <h2 id="faq-title" className="text-2xl font-semibold">
          {t("faqTitle")}
        </h2>
        <div className="bg-card divide-y rounded-xl border">
          {FAQ.map((key) => (
            <details key={key} className="group px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium [&::-webkit-details-marker]:hidden">
                <h3>{t(`faq.${key}.q`)}</h3>
                <ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="text-muted-foreground mt-2">{t(`faq.${key}.a`)}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
