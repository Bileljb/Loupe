import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, ChevronDown, CircleCheck, Sparkles } from "lucide-react";
import { areaIcons } from "@/components/areaIcons";
import { AuditForm } from "@/components/audit/AuditForm";
import { JsonLd } from "@/components/JsonLd";
import { ReportPreview } from "@/components/report/ReportPreview";
import { Link } from "@/i18n/navigation";
import { checkRegistry } from "@/lib/checks/registry";
import { getKbEntry } from "@/lib/kb";
import { guideSlugs, popularGuides } from "@/lib/guides";
import { localeUrl, pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/siteConfig";
import { cn } from "@/lib/utils";

// Bento layout: [speed (wide) | search] then [ease of use | technical | local].
const CHECK_AREAS = [
  { key: "performance", span: "lg:col-span-2" },
  { key: "seo", span: "" },
  { key: "accessibility", span: "" },
  { key: "technical", span: "" },
  { key: "local", span: "" },
] as const;
const STEPS = ["step1", "step2", "step3"] as const;
const FAQ = ["free", "signup", "what", "full", "kept", "rescan"] as const;
const TRUST = ["trustFree", "trustNoSignup", "trustFast"] as const;

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

function SectionHeading({ id, eyebrow, title, intro }: { id: string; eyebrow?: string; title: string; intro?: string }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
      {eyebrow && <p className="text-primary text-sm font-semibold">{eyebrow}</p>}
      <h2 id={id} className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {intro && <p className="text-muted-foreground text-lg">{intro}</p>}
    </div>
  );
}

export default function HomePage() {
  const locale = useLocale();
  const t = useTranslations("HomePage");
  const tMeta = useTranslations("Metadata");

  return (
    <main className="flex flex-1 flex-col">
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

      {/* Hero */}
      <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="bg-grid absolute inset-0" />
          <div className="bg-glow absolute inset-x-0 -top-40 mx-auto h-[560px] w-[900px] max-w-[160vw] opacity-80" />
        </div>

        <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24">
          <p className="bg-card/80 text-muted-foreground shadow-soft motion-safe:animate-in motion-safe:fade-in inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium motion-safe:duration-700">
            <Sparkles aria-hidden="true" className="text-primary size-4" />
            {t("eyebrow")}
          </p>
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 flex flex-col gap-5 motion-safe:duration-700">
            <h1 id="hero-title" className="text-gradient text-4xl leading-[1.08] font-bold tracking-tight sm:text-6xl">
              {t("title")}
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg sm:text-xl">{t("intro")}</p>
          </div>

          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 w-full motion-safe:delay-150 motion-safe:duration-700 motion-safe:fill-mode-both">
            <AuditForm />
          </div>

          <ul className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            {TRUST.map((key) => (
              <li key={key} className="flex items-center gap-1.5">
                <CircleCheck aria-hidden="true" className="text-good size-4" />
                {t(key)}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground max-w-xl text-sm">{t("scope")}</p>
        </div>

        <div className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
          <ReportPreview />
        </div>
      </section>

      {/* What we check */}
      <section aria-labelledby="checks-title" className="reveal mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading id="checks-title" title={t("checksTitle")} intro={t("trust")} />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CHECK_AREAS.map(({ key, span }) => {
            const Icon = areaIcons[key];
            return (
              <li
                key={key}
                className={cn(
                  "bg-card shadow-soft group relative overflow-hidden rounded-2xl border p-6 transition-colors hover:border-primary/40",
                  span,
                )}
              >
                <div aria-hidden="true" className="bg-glow pointer-events-none absolute -end-16 -top-16 size-48 opacity-0 transition-opacity group-hover:opacity-60" />
                <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{t(`checks.${key}.title`)}</h3>
                <p className="text-muted-foreground mt-2">{t(`checks.${key}.body`)}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-title" className="reveal border-y bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <SectionHeading id="how-title" title={t("howTitle")} />
          <ol className="relative mt-12 grid gap-4 md:grid-cols-3">
            {/* A thin line connecting the steps on wide screens. */}
            <div aria-hidden="true" className="from-primary/0 via-primary/40 to-primary/0 absolute inset-x-[16%] top-7 hidden h-px bg-linear-to-r md:block" />
            {STEPS.map((step, index) => (
              <li key={step} className="bg-card shadow-soft relative flex flex-col gap-4 rounded-2xl border p-6">
                <span aria-hidden="true" className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full text-sm font-bold shadow-soft">
                  {index + 1}
                </span>
                <p className="text-lg">{t(`how.${step}`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Who it's for */}
      <section aria-labelledby="who-title" className="reveal mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="border-gradient relative overflow-hidden rounded-3xl p-8 sm:p-12">
          <div aria-hidden="true" className="bg-glow pointer-events-none absolute -end-24 -bottom-24 size-96 opacity-50" />
          <div className="relative grid gap-6 md:grid-cols-[1fr_2fr] md:items-center">
            <h2 id="who-title" className="text-3xl font-semibold tracking-tight">
              {t("whoTitle")}
            </h2>
            <p className="text-muted-foreground text-lg">{t("who")}</p>
          </div>
        </div>
      </section>

      {/* Popular guides */}
      <section aria-labelledby="guides-title" className="reveal mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="guides-title" className="text-3xl font-semibold tracking-tight">
            {t("guidesTitle")}
          </h2>
          <Link href="/guides" className="text-primary inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline">
            {t("guidesAll")}
            <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          </Link>
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {popularGuides.map((id) => {
            const Icon = areaIcons[id.startsWith("local.") ? "local" : checkRegistry[id].category];
            return (
              <li key={id}>
                <Link
                  href={`/guides/${guideSlugs[id]}`}
                  className="bg-card hover:border-primary/40 shadow-soft group flex h-full items-start gap-4 rounded-2xl border p-5 transition-colors"
                >
                  <span className="bg-muted text-muted-foreground group-hover:text-primary flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="flex-1 font-medium">{getKbEntry(locale, id).title}</span>
                  <ArrowRight aria-hidden="true" className="text-muted-foreground mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="reveal mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <h2 id="faq-title" className="text-3xl font-semibold tracking-tight">
            {t("faqTitle")}
          </h2>
          <div className="flex flex-col gap-3">
            {FAQ.map((key) => (
              <details key={key} className="bg-card group rounded-2xl border px-5 py-4 transition-colors open:border-primary/30">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                  <h3>{t(`faq.${key}.q`)}</h3>
                  <span className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-full transition-transform group-open:rotate-180">
                    <ChevronDown aria-hidden="true" className="size-4" />
                  </span>
                </summary>
                <p className="text-muted-foreground mt-3">{t(`faq.${key}.a`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section aria-labelledby="cta-title" className="reveal mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
        <div className="bg-primary text-primary-foreground relative isolate overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-30 [background:radial-gradient(60%_80%_at_50%_0%,white,transparent)]" />
          <h2 id="cta-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("finalCtaTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-lg opacity-90">{t("finalCtaBody")}</p>
          <a
            href="#audit-form"
            className="bg-background text-foreground focus-visible:ring-background/50 mt-8 inline-flex h-12 items-center gap-2 rounded-xl px-6 font-semibold shadow-soft outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-3"
          >
            {t("finalCtaButton")}
            <ArrowRight aria-hidden="true" className="size-5 rtl:-scale-x-100" />
          </a>
        </div>
      </section>
    </main>
  );
}
