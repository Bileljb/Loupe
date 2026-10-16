import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { categorySchema } from "@/lib/schemas";
import { letterGrade } from "@/lib/scoring/score";
import { getReportStorage, reportExpiresAt } from "@/lib/storage/reports";

// Unguessable, expiring snapshots of third-party sites: never indexed, never in the sitemap.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Western digits in every language; UTC so the server and the reader agree on the date.
const dateFormat = { dateStyle: "long", timeZone: "UTC", numberingSystem: "latn" } as const;

export default function ReportPage({ params }: PageProps<"/[locale]/report/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12 text-start">
      <Suspense fallback={<ReportSkeleton />}>
        <ReportView params={params} />
      </Suspense>
    </main>
  );
}

async function ReportView({ params }: Pick<PageProps<"/[locale]/report/[id]">, "params">) {
  const { id } = await params;
  const result = await getReportStorage().getReport(id);
  if (result.status !== "found") notFound();

  const { report } = result;
  const t = await getTranslations("Report");
  const format = await getFormatter();
  const formatDate = (date: Date) => format.dateTime(date, dateFormat);
  const score = (value: number) => format.number(value, { numberingSystem: "latn" });

  return (
    <>
      <header className="flex flex-col gap-2">
        {/* The host comes from the audited site; React escapes it. */}
        <h1 className="text-3xl font-bold tracking-tight">{t("title", { host: new URL(report.url).host })}</h1>
        <p className="text-muted-foreground text-sm">{t("checkedOn", { date: formatDate(new Date(report.createdAt)) })}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("grade", { grade: letterGrade(report.scores.overall) })}</CardTitle>
        </CardHeader>
        <CardContent>{t("overall", { score: score(report.scores.overall) })}</CardContent>
      </Card>

      <section aria-labelledby="scores-title" className="flex flex-col gap-3">
        <h2 id="scores-title" className="text-xl font-semibold">
          {t("categoriesTitle")}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {categorySchema.options.map((category) => {
            const value = report.scores[category];
            return (
              <li key={category} className="bg-card flex flex-col gap-1 rounded-xl border p-4">
                <span className="font-medium">{t(`categories.${category}`)}</span>
                <span className="text-muted-foreground">
                  {value === null ? t("notChecked") : t("score", { score: score(value) })}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-muted-foreground text-sm">{t("expires", { date: formatDate(reportExpiresAt(report)) })}</p>
    </>
  );
}

async function ReportSkeleton() {
  const t = await getTranslations("Report");
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <span className="sr-only" role="status">
        {t("loading")}
      </span>
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-3 sm:grid-cols-2">
        {categorySchema.options.map((category) => (
          <Skeleton key={category} className="h-20" />
        ))}
      </div>
    </div>
  );
}
