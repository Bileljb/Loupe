import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowDown, ArrowUp, CircleCheck, Minus, PartyPopper } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { KbEntry } from "@/lib/kb";
import type { Comparison, ScoreChange } from "@/lib/report/compare";
import { categorySchema, type Issue } from "@/lib/schemas";
import { issueAnchor } from "./IssueCard";
import { SeverityIcon } from "./SeverityBadge";

type Props = {
  comparison: Comparison;
  previousId: string;
  previousDate: string;
  entry: (issue: Issue) => KbEntry;
};

/** "Since your last check": score changes, fixed issues celebrated, what's new and what's left. */
export async function ComparePanel({ comparison, previousId, previousDate, entry }: Props) {
  const t = await getTranslations("Report.compare");
  const tCategories = await getTranslations("Report.categories");
  const format = await getFormatter();
  const num = (value: number) => format.number(value, { numberingSystem: "latn" });
  const { overall } = comparison;

  const headline =
    overall.delta === null || overall.before === null || overall.after === null
      ? null
      : overall.delta > 0
        ? t("improved", { before: num(overall.before), after: num(overall.after) })
        : overall.delta < 0
          ? t("dropped", { before: num(overall.before), after: num(overall.after) })
          : t("same", { score: num(overall.after) });

  return (
    <section aria-labelledby="compare-title" className="border-good/40 bg-good/5 flex flex-col gap-5 rounded-2xl border p-6">
      <div className="flex flex-col gap-1">
        <h2 id="compare-title" className="text-xl font-semibold">
          {t("title")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("since", { date: previousDate })}{" "}
          <Link href={`/report/${previousId}`} className="text-primary font-medium underline-offset-4 hover:underline">
            {t("previousLink")}
          </Link>
        </p>
        {headline && <p className="text-lg font-medium">{headline}</p>}
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {categorySchema.options.map((category) => (
          <li key={category} className="bg-card flex flex-col gap-1 rounded-lg border p-3">
            <span className="text-sm font-medium">{tCategories(category)}</span>
            <Delta change={comparison.categories[category]} />
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <h3 className="flex items-center gap-2 font-semibold">
          <PartyPopper aria-hidden="true" className="text-good size-5" />
          {t("fixedTitle")}
          <span className="bg-muted rounded-full px-2 text-sm tabular-nums">{num(comparison.fixed.length)}</span>
        </h3>
        {comparison.fixed.length > 0 ? (
          <>
            <p className="text-muted-foreground text-sm">{t("fixedIntro")}</p>
            <ul className="flex flex-col gap-1">
              {comparison.fixed.map((issue) => (
                <li key={issue.id} className="flex items-start gap-2">
                  <CircleCheck aria-hidden="true" className="text-good mt-0.5 size-4 shrink-0" />
                  <span>
                    <span className="sr-only">{t("fixedLabel")}: </span>
                    {entry(issue).title}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">{t("noneFixed")}</p>
        )}
      </div>

      {comparison.newIssues.length > 0 && (
        <IssueLinks title={t("newTitle")} intro={t("newIntro")} issues={comparison.newIssues} entry={entry} num={num} />
      )}
      {comparison.stillOpen.length > 0 && (
        <IssueLinks title={t("stillOpenTitle")} intro={t("stillOpenIntro")} issues={comparison.stillOpen} entry={entry} num={num} />
      )}
    </section>
  );
}

async function Delta({ change }: { change: ScoreChange }) {
  const t = await getTranslations("Report.compare");
  const format = await getFormatter();
  const num = (value: number) => format.number(value, { numberingSystem: "latn" });
  if (change.delta === null) return <span className="text-muted-foreground text-sm">{t("notCompared")}</span>;
  // Up/down arrows are vertical, so they don't flip in RTL. The text carries the meaning, not the color.
  if (change.delta > 0)
    return (
      <span className="text-good flex items-center gap-1 text-sm font-medium">
        <ArrowUp aria-hidden="true" className="size-4" />
        {t("up", { points: num(change.delta) })}
      </span>
    );
  if (change.delta < 0)
    return (
      <span className="text-critical flex items-center gap-1 text-sm font-medium">
        <ArrowDown aria-hidden="true" className="size-4" />
        {t("down", { points: num(-change.delta) })}
      </span>
    );
  return (
    <span className="text-muted-foreground flex items-center gap-1 text-sm">
      <Minus aria-hidden="true" className="size-4" />
      {t("unchanged")}
    </span>
  );
}

function IssueLinks({
  title,
  intro,
  issues,
  entry,
  num,
}: {
  title: string;
  intro: string;
  issues: Issue[];
  entry: (issue: Issue) => KbEntry;
  num: (value: number) => string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 font-semibold">
        {title}
        <span className="bg-muted rounded-full px-2 text-sm tabular-nums">{num(issues.length)}</span>
      </h3>
      <p className="text-muted-foreground text-sm">{intro}</p>
      <ul className="flex flex-col gap-1">
        {issues.map((issue) => (
          <li key={issue.id} className="flex items-start gap-2">
            <SeverityIcon severity={issue.severity} className="mt-0.5 size-4" />
            <a href={`#${issueAnchor(issue.id)}`} className="underline-offset-4 hover:underline">
              {entry(issue).title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
