import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getKbEntry } from "@/lib/kb";
import { EXAMPLE_REPORT_ID, exampleReport, trustedPlatform } from "@/lib/report";
import { categorySchema } from "@/lib/schemas";
import { fixFirst, letterGrade } from "@/lib/scoring/score";
import { ScoreRing } from "./ScoreRing";

/** A live miniature of the example report for the landing page: real data, real components. */
export async function ReportPreview() {
  const locale = await getLocale();
  const t = await getTranslations("Report");
  const tHome = await getTranslations("HomePage");
  const format = await getFormatter();
  const num = (value: number) => format.number(value, { numberingSystem: "latn" });
  const report = exampleReport();
  const platform = trustedPlatform(report) ?? "unknown";
  const grade = letterGrade(report.scores.overall);

  return (
    // The whole card is clickable through the link's ::after, but the link's name stays short.
    <div className="group border-gradient shadow-lift has-focus-visible:ring-ring/50 relative rounded-3xl p-5 text-start transition-transform has-focus-visible:ring-3 motion-safe:hover:-translate-y-1 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold">{tHome("previewLabel")}</span>
        <Link
          href={`/report/${EXAMPLE_REPORT_ID}`}
          className="text-muted-foreground group-hover:text-foreground flex items-center gap-1 rounded-3xl text-sm outline-none transition-colors after:absolute after:inset-0 after:rounded-3xl"
        >
          {tHome("exampleLink")}
          <ArrowUpRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
        </Link>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
        <div className="flex items-center gap-4">
          <div className="bg-primary text-primary-foreground flex size-20 shrink-0 items-center justify-center rounded-2xl text-4xl font-bold shadow-soft">
            {grade}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold">rosas-bakery.example</span>
            <span className="text-muted-foreground text-sm">{t("overall", { score: num(report.scores.overall) })}</span>
          </div>
        </div>
        <ul className="grid grid-cols-4 gap-2">
          {categorySchema.options.map((category) => {
            const value = report.scores[category];
            const name = t(`categories.${category}`);
            return (
              <li key={category} className="flex flex-col items-center gap-1.5 text-center">
                <ScoreRing
                  value={value}
                  display={value === null ? "–" : num(value)}
                  label={`${name}: ${value === null ? t("notChecked") : t("score", { score: num(value) })}`}
                  className="size-14 sm:size-16"
                  textClassName="text-sm sm:text-base"
                  strokeWidth={9}
                />
                <span className="text-muted-foreground line-clamp-2 text-[11px] leading-tight sm:text-xs">{name}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="bg-muted/50 mt-6 rounded-2xl p-4">
        <p className="text-sm font-semibold">{t("fixFirst.title")}</p>
        <ol className="mt-2 flex flex-col gap-2">
          {fixFirst(report.issues).map((issue, index) => (
            <li key={issue.id} className="flex items-center gap-3 text-sm">
              <span aria-hidden="true" className="bg-background flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                {index + 1}
              </span>
              <span className="truncate">{getKbEntry(locale, issue.id, platform).title}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
