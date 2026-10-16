import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, CircleCheck, Clock, Info, Send, TriangleAlert } from "lucide-react";
import { areaIcons } from "@/components/areaIcons";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { localeNames, type AppLocale } from "@/i18n/routing";
import { getKbEntry, type KbEntry } from "@/lib/kb";
import { buildDeveloperMessage } from "@/lib/report/developerMessage";
import { blockedStatus, loadReport, platformNames, trustedPlatform, vitalsFrom } from "@/lib/report";
import { compareReports } from "@/lib/report/compare";
import { categorySchema, type Issue, type Report, type Severity } from "@/lib/schemas";
import { fixFirst, letterGrade, type Grade } from "@/lib/scoring/score";
import { siteConfig } from "@/lib/siteConfig";
import { reportExpiresAt } from "@/lib/storage/reports";
import { cn } from "@/lib/utils";
import { ComparePanel } from "./ComparePanel";
import { CopyButton } from "./CopyButton";
import { DeveloperMessage } from "./DeveloperMessage";
import { IssueCard, issueAnchor } from "./IssueCard";
import { RescanButton } from "./RescanButton";
import { ScoreRing, scoreBand, type ScoreBand } from "./ScoreRing";
import { SeverityIcon } from "./SeverityBadge";
import { TechnicalViewToggle } from "./TechnicalViewToggle";

const SEVERITIES: Severity[] = ["critical", "warning", "info"];
// Western digits in every language; UTC so the server and the reader agree on the date.
const dateFormat = { dateStyle: "long", timeZone: "UTC", numberingSystem: "latn" } as const;

const gradeStyle: Record<Grade, string> = {
  A: "from-good to-good/70",
  B: "from-primary to-glow",
  C: "from-warning to-warning/70",
  D: "from-warning to-critical/80",
  F: "from-critical to-critical/70",
};
const bandText: Record<ScoreBand, string> = { good: "text-good", ok: "text-warning", poor: "text-critical" };

type Props = {
  report: Report;
  /** The id in the URL (differs from report.id for the example report). */
  routeId: string;
  isExample?: boolean;
};

export async function ReportDashboard({ report, routeId, isExample = false }: Props) {
  const locale = await getLocale();
  const t = await getTranslations("Report");
  const tHome = await getTranslations("HomePage");
  const format = await getFormatter();
  const num = (value: number) => format.number(value, { numberingSystem: "latn" });
  const formatDate = (date: Date) => format.dateTime(date, dateFormat);

  const platform = trustedPlatform(report);
  const platformName = platform ? platformNames[platform] : undefined;
  const entry = (issue: Issue): KbEntry => getKbEntry(locale, issue.id, platform ?? "unknown");

  const failed = report.issues.filter((issue) => !issue.passed);
  const passed = report.issues.filter((issue) => issue.passed);
  const firstFixes = fixFirst(report.issues);
  const vitals = report.scores.performance === null ? [] : vitalsFrom(report.issues);
  const blocked = blockedStatus(report.issues);
  const grade = letterGrade(report.scores.overall);
  // First-strong isolate marks keep the (left-to-right) domain intact inside Arabic text.
  const host = `⁨${new URL(report.url).host}⁩`;
  const previous = await loadPrevious(report);
  const groups = SEVERITIES.map((severity) => ({ severity, issues: failed.filter((issue) => issue.severity === severity) })).filter(
    (group) => group.issues.length > 0,
  );

  const toc = [
    { href: "#overview", label: t("toc.overview") },
    ...(previous ? [{ href: "#compare-title", label: t("compare.title") }] : []),
    { href: "#fix-first-title", label: t("fixFirst.title") },
    ...(vitals.length > 0 ? [{ href: "#vitals-title", label: t("vitals.title") }] : []),
    ...(failed.length > 0 ? [{ href: "#developer-title", label: t("developer.title") }] : []),
    ...groups.map((group) => ({ href: `#group-${group.severity}`, label: t(`groups.${group.severity}`), count: group.issues.length })),
    ...(passed.length > 0 ? [{ href: "#passed-title", label: t("passed.title"), count: passed.length }] : []),
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div className="flex min-w-0 flex-col gap-10">
        {/* Summary */}
        <section id="overview" aria-labelledby="report-title" className="border-gradient shadow-lift relative isolate overflow-hidden rounded-3xl p-6 sm:p-8">
          <div aria-hidden="true" className="bg-glow pointer-events-none absolute -end-32 -top-32 -z-10 size-[420px] opacity-50" />
          <div className="flex flex-col gap-1">
            {isExample && (
              <span className="bg-primary/10 text-primary mb-2 w-fit rounded-full px-2.5 py-1 text-xs font-semibold">
                {tHome("previewLabel")}
              </span>
            )}
            {/* The host comes from the audited site; React escapes it. */}
            <h1 id="report-title" className="text-2xl font-bold tracking-tight break-words sm:text-3xl">
              {t("title", { host })}
            </h1>
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Clock aria-hidden="true" className="size-3.5" />
              {t("checkedOn", { date: formatDate(new Date(report.createdAt)) })}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div
              aria-hidden="true"
              className={cn(
                // Severity colors are dark in light mode and light in dark mode: flip the text to keep contrast.
                "flex size-28 shrink-0 items-center justify-center rounded-3xl bg-linear-to-br text-6xl font-bold text-white shadow-soft dark:text-[oklch(0.17_0.03_265)]",
                gradeStyle[grade],
              )}
            >
              {grade}
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-semibold">{t("grade", { grade })}</h2>
              <p className="text-lg">{t(`gradeSummary.${grade}`)}</p>
              <p className="text-muted-foreground">{t("overall", { score: num(report.scores.overall) })}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-start gap-3 border-t pt-6">
            <CopyButton label={t("actions.copyLink")} copiedLabel={t("actions.copied")} failedLabel={t("actions.copyFailed")} />
            <div className="ms-auto">
              <TechnicalViewToggle label={t("actions.technicalView")} hint={t("actions.technicalViewHint")} />
            </div>
          </div>
          {/* The example's site is made up, so it can't be re-scanned. */}
          {!isExample && (
            <div className="mt-4">
              <RescanButton reportId={report.id} url={report.url} localChecks={report.localChecks} />
            </div>
          )}
        </section>

        {isExample && (
          <div role="note" className="bg-primary/5 border-primary/20 flex flex-col items-start gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center">
            <Info aria-hidden="true" className="text-primary size-5 shrink-0" />
            <p className="flex-1">{t("exampleNotice")}</p>
            <Link href="/" className={buttonVariants({ size: "lg" })}>
              {t("exampleCta")}
              <ArrowRight aria-hidden="true" className="rtl:-scale-x-100" />
            </Link>
          </div>
        )}

        <Banners report={report} blocked={blocked} platformName={platformName} />

        {previous && (
          <ComparePanel
            comparison={compareReports(previous, report)}
            previousId={previous.id}
            previousDate={formatDate(new Date(previous.createdAt))}
            entry={entry}
          />
        )}

        {/* Scores by area */}
        <section aria-labelledby="scores-title" className="flex flex-col gap-4">
          <h2 id="scores-title" className="text-xl font-semibold">
            {t("categoriesTitle")}
          </h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {categorySchema.options.map((category) => {
              const value = report.scores[category];
              const name = t(`categories.${category}`);
              const text = value === null ? t("notChecked") : t("score", { score: num(value) });
              const band = value === null ? null : scoreBand(value);
              const Icon = areaIcons[category];
              return (
                <li key={category} className="bg-card shadow-soft relative flex flex-col items-center gap-3 rounded-2xl border p-5 text-center">
                  <Icon aria-hidden="true" className="text-muted-foreground absolute start-3 top-3 size-4" />
                  <ScoreRing value={value} display={value === null ? "–" : num(value)} label={`${name}: ${text}`} />
                  <span className="text-sm font-medium">{name}</span>
                  {/* The band in words, so the ring color is never the only signal. */}
                  <span className={cn("text-xs font-semibold", band ? bandText[band] : "text-muted-foreground")}>
                    {band ? t(`band.${band}`) : t("notChecked")}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Fix these first */}
        <section aria-labelledby="fix-first-title" className="border-gradient relative overflow-hidden rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-1">
            <h2 id="fix-first-title" className="text-xl font-semibold">
              {t("fixFirst.title")}
            </h2>
            <p className="text-muted-foreground">{firstFixes.length > 0 ? t("fixFirst.intro") : t("fixFirst.none")}</p>
          </div>
          {firstFixes.length > 0 && (
            <ol className="mt-6 flex flex-col gap-3">
              {firstFixes.map((issue, index) => {
                const kb = entry(issue);
                return (
                  <li key={issue.id} className="bg-background/60 hover:border-primary/40 flex gap-4 rounded-2xl border p-4 transition-colors">
                    <span
                      aria-hidden="true"
                      className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-xl font-bold shadow-soft"
                    >
                      {num(index + 1)}
                    </span>
                    <div className="flex min-w-0 flex-col gap-1">
                      <h3 className="font-semibold">{kb.title}</h3>
                      <p className="text-muted-foreground">{kb.businessImpact}</p>
                      <a
                        href={`#${issueAnchor(issue.id)}`}
                        className="text-primary inline-flex w-fit items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
                      >
                        {t("fixFirst.details")}
                        <span className="sr-only">: {kb.title}</span>
                        <ArrowRight aria-hidden="true" className="size-3.5 rtl:-scale-x-100" />
                      </a>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Speed in plain words */}
        {vitals.length > 0 && (
          <section aria-labelledby="vitals-title" className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="vitals-title" className="text-xl font-semibold">
                {t("vitals.title")}
              </h2>
              <p className="text-muted-foreground text-sm">{t("vitals.source")}</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {vitals.map((vital) => (
                <li key={vital.key} className="bg-card shadow-soft flex items-center gap-3 rounded-2xl border p-4">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl",
                      vital.good ? "bg-good/12 text-good" : "bg-warning/12 text-warning",
                    )}
                  >
                    {vital.good ? <CircleCheck aria-hidden="true" className="size-5" /> : <TriangleAlert aria-hidden="true" className="size-5" />}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium">{t(`vitals.${vital.key}`)}</span>
                    <span className={cn("text-sm font-medium", vital.good ? "text-good" : "text-warning")}>
                      {vital.good ? t("vitals.good") : t("vitals.needsWork")}
                    </span>
                  </div>
                  {vital.seconds !== undefined && (
                    <span className="text-lg font-semibold tabular-nums">
                      {t("vitals.seconds", {
                        value: format.number(vital.seconds, { numberingSystem: "latn", minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                      })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Send to my developer */}
        {failed.length > 0 && (
          <section aria-labelledby="developer-title" className="bg-card shadow-soft flex flex-col gap-4 rounded-3xl border p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                <Send aria-hidden="true" className="size-5 rtl:-scale-x-100" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 id="developer-title" className="text-xl font-semibold">
                  {t("developer.title")}
                </h2>
                <p className="text-muted-foreground">{t("developer.intro")}</p>
              </div>
            </div>
            <DeveloperMessage messages={await developerMessages(report, routeId, locale)} />
          </section>
        )}

        {/* Everything we found */}
        {groups.length > 0 && (
          <section aria-labelledby="issues-title" className="flex flex-col gap-8">
            <h2 id="issues-title" className="text-2xl font-semibold tracking-tight">
              {t("groups.title")}
            </h2>
            {groups.map(({ severity, issues }) => (
              <section key={severity} aria-labelledby={`group-${severity}`} className="flex flex-col gap-4">
                <h3 id={`group-${severity}`} className="flex items-center gap-2 text-lg font-semibold">
                  <SeverityIcon severity={severity} />
                  {t(`groups.${severity}`)}
                  <span className="bg-muted rounded-full px-2.5 text-sm font-medium tabular-nums">
                    <span className="sr-only">{t("groups.count")}: </span>
                    {num(issues.length)}
                  </span>
                </h3>
                {issues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} entry={entry(issue)} platformName={platformName} />
                ))}
              </section>
            ))}
          </section>
        )}

        {/* What's working */}
        {passed.length > 0 && (
          <section aria-labelledby="passed-title" className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="passed-title" className="flex items-center gap-2 text-xl font-semibold">
                <CircleCheck aria-hidden="true" className="text-good size-5" />
                {t("passed.title")}
              </h2>
              <p className="text-muted-foreground">{t("passed.intro")}</p>
            </div>
            {/* KB titles describe problems, so passed checks are summarized as counts per area. */}
            <ul className="grid gap-3 sm:grid-cols-2">
              {categorySchema.options.map((category) => {
                const count = passed.filter((issue) => issue.category === category).length;
                if (count === 0) return null;
                const Icon = areaIcons[category];
                return (
                  <li key={category} className="bg-card flex items-center gap-3 rounded-2xl border p-4">
                    <span className="bg-good/12 text-good flex size-9 items-center justify-center rounded-xl">
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <span className="flex-1 font-medium">{t(`categories.${category}`)}</span>
                    <span className="bg-good/12 text-good rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums">{num(count)}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <footer className="text-muted-foreground flex flex-col gap-1 border-t pt-6 text-sm">
          <p>{t("scope")}</p>
          {!isExample && <p>{t("expires", { date: formatDate(reportExpiresAt(report)) })}</p>}
        </footer>
      </div>

      {/* On this page: wide screens only, follows the scroll. */}
      <aside className="hidden lg:block">
        <nav aria-label={t("toc.title")} className="sticky top-24 flex flex-col gap-3">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{t("toc.title")}</p>
          <ul className="flex flex-col gap-0.5 border-s">
            {toc.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground hover:border-primary -ms-px flex items-center justify-between gap-2 border-s-2 border-transparent py-1.5 ps-4 text-sm transition-colors"
                >
                  <span>{item.label}</span>
                  {"count" in item && item.count !== undefined && <span className="text-xs tabular-nums">{num(item.count)}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
}

async function Banners({ report, blocked, platformName }: { report: Report; blocked: number | null; platformName?: string }) {
  const t = await getTranslations("Report.banners");
  const banners: { key: string; title: string; body: string }[] = [];
  if (report.partial?.psiFailed) banners.push({ key: "psi", title: t("psiFailedTitle"), body: t("psiFailed") });
  if (report.partial?.htmlFailed) banners.push({ key: "html", title: t("htmlFailedTitle"), body: t("htmlFailed") });
  if (blocked !== null) banners.push({ key: "blocked", title: t("blockedTitle"), body: t("blocked", { status: String(blocked) }) });
  if (report.partial?.jsShellSuspected) banners.push({ key: "js", title: t("jsShellTitle"), body: t("jsShell") });

  if (banners.length === 0 && !platformName) return null;
  return (
    <div className="flex flex-col gap-3">
      {banners.map((banner) => (
        <div key={banner.key} role="alert" className="border-warning/30 bg-warning/8 flex gap-3 rounded-2xl border p-4">
          <TriangleAlert aria-hidden="true" className="text-warning mt-0.5 size-5 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <p className="font-semibold">{banner.title}</p>
            <p className="text-muted-foreground text-sm">{banner.body}</p>
          </div>
        </div>
      ))}
      {platformName && (
        // Informational, not an alert.
        <div role="note" className="bg-muted/50 flex items-center gap-3 rounded-2xl border p-4 text-sm">
          <Info aria-hidden="true" className="text-primary size-5 shrink-0" />
          <p>{t("platform", { platform: platformName })}</p>
        </div>
      )}
    </div>
  );
}

/** The report this one re-scanned. Missing, expired or unreadable: show the new report alone. */
async function loadPrevious(report: Report): Promise<Report | null> {
  if (!report.previousReportId) return null;
  try {
    const result = await loadReport(report.previousReportId);
    // Re-scans reuse the previous report's page, but never compare two different pages.
    return result.status === "found" && result.report.url === report.url ? result.report : null;
  } catch {
    return null;
  }
}

/** "Send to my developer" text in the current language, plus English for developers. */
async function developerMessages(report: Report, routeId: string, locale: AppLocale) {
  const platform = trustedPlatform(report);
  const locales: AppLocale[] = locale === "en" ? ["en"] : [locale, "en"];
  return Promise.all(
    locales.map(async (messageLocale) => {
      const t = await getTranslations({ locale: messageLocale, namespace: "DeveloperMessage" });
      const format = await getFormatter({ locale: messageLocale });
      const text = buildDeveloperMessage(
        report.issues,
        (issue) => getKbEntry(messageLocale, issue.id, platform ?? "unknown"),
        {
          heading: t("heading", { url: report.url }),
          checkedOn: t("checkedOn", { date: format.dateTime(new Date(report.createdAt), dateFormat), tool: siteConfig.name }),
          report: t("report", { link: `${siteConfig.url}/${messageLocale}/report/${routeId}` }),
          ...(platform ? { platform: t("platform", { platform: platformNames[platform] }) } : {}),
          groups: { critical: t("groups.critical"), warning: t("groups.warning"), info: t("groups.info") },
          fix: t("fix"),
          evidence: t("evidence"),
          example: t("example"),
          none: t("none"),
        },
      );
      return { locale: messageLocale, name: localeNames[messageLocale], text };
    }),
  );
}
