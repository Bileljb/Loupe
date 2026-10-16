import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { reportTtlDays } from "@/lib/storage/reports";

// Missing, expired, damaged and unsupported-version reports all land here.
export default async function ReportNotFound() {
  const t = await getTranslations("ReportNotFound");
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start gap-4 px-6 py-16 text-start">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("body", { days: reportTtlDays() })}</p>
      <Link href="/" className={buttonVariants()}>
        {t("cta")}
      </Link>
    </main>
  );
}
