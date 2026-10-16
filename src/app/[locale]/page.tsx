import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { AuditForm } from "@/components/audit/AuditForm";
import { Link } from "@/i18n/navigation";
import { EXAMPLE_REPORT_ID } from "@/lib/report";

export default function HomePage() {
  const t = useTranslations("HomePage");
  const tSite = useTranslations("Site");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12 text-start sm:px-6 sm:py-16">
      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">{tSite("tagline")}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
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
    </main>
  );
}
