import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ReportDashboard } from "@/components/report/ReportDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { loadReport } from "@/lib/report";

// Unguessable, expiring snapshots of third-party sites: never indexed, never in the sitemap.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ReportPage({ params }: PageProps<"/[locale]/report/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 text-start sm:px-6">
      <Suspense fallback={<ReportSkeleton />}>
        <ReportContent params={params} />
      </Suspense>
    </main>
  );
}

async function ReportContent({ params }: Pick<PageProps<"/[locale]/report/[id]">, "params">) {
  const { id } = await params;
  const result = await loadReport(id);
  // Missing, expired, damaged and unsupported-version reports share one friendly page.
  if (result.status !== "found") notFound();
  return <ReportDashboard report={result.report} routeId={id} isExample={result.isExample} />;
}

async function ReportSkeleton() {
  const t = await getTranslations("Report");
  return (
    <div className="flex flex-col gap-8" aria-busy="true">
      <span className="sr-only" role="status">
        {t("loading")}
      </span>
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {["a", "b", "c", "d"].map((key) => (
          <Skeleton key={key} className="h-40 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}
