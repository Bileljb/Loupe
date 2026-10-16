import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { CircleCheck, Info, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { localeNames, type AppLocale } from "@/i18n/routing";
import { getKbEntry, type KbEntry } from "@/lib/kb";
import { buildDeveloperMessage } from "@/lib/report/developerMessage";
import { blockedStatus, loadReport, platformNames, trustedPlatform, vitalsFrom } from "@/lib/report";
import { compareReports } from "@/lib/report/compare";
import { categorySchema, type Issue, type Report, type Severity } from "@/lib/schemas";
import { fixFirst, letterGrade } from "@/lib/scoring/score";
import { siteConfig } from "@/lib/siteConfig";
import { reportExpiresAt } from "@/lib/storage/reports";
import { ComparePanel } from "./ComparePanel";
import { CopyButton } from "./CopyButton";
import { DeveloperMessage } from "./DeveloperMessage";
import { IssueCard, issueAnchor } from "./IssueCard";
import { RescanButton } from "./RescanButton";
import { ScoreRing } from "./ScoreRing";
import { SeverityIcon } from "./SeverityBadge";
import { TechnicalViewToggle } from "./TechnicalViewToggle";

const SEVERITIES: Severity[] = ["critical", "warning", "info"];
// Western digits in every language; UTC so the server and the reader agree on the date.
const dateFormat = { dateStyle: "long", timeZone: "UTC", numberingSystem: "latn" } as const;

type Props = {
  report: Report;
  /** The id in the URL (differs from report.id for the example report). */
  routeId: string;
  isExample?: boolean;
};

export async function ReportDashboard({ report, routeId, isExample = false }: Props) {
  const locale = await getLocale();
  const t = await getTranslations("Report");
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
  const host = new URL(report.url).host;
  const previous = await loadPrevious(report);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          {/* The host comes from the audited site; React escapes it. */}
          <h1 className="text-3xl font-bold tracking-tight break-words">{t("title", { host })}</h1>
          <p className="text-muted-foreground text-sm">{t("checkedOn", { date: formatDate(new Date(report.createdAt)) })}</p>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <CopyButton label={t("actions.copyLink")} copiedLabel={t("actions.copied")} failedLabel={t("actions.copyFailed")} />
          <TechnicalViewToggle label={t("actions.technicalView")} hint={t("actions.technicalViewHint")} />
        </div>
        {/* The example's site is made up, so it can't be re-scanned. */}
        {!isExample && <RescanButton reportId={report.id} url={report.url} localChecks={report.localChecks} />}
      </header>

      {previous && (
        <ComparePanel
          comparison={compareReports(previous, report)}
          previousId={previous.id}
          previousDate={formatDate(new Date(previous.createdAt))}
          entry={entry}
        />
      )}

      {isExample && (
        <Alert>
          <Info aria-hidden="true" />
          <AlertDescription className="flex flex-col items-start gap-2">
            <p>{t("exampleNotice")}</p>
            <Link href="/" className={buttonVariants({ size: "sm" })}>
              {t("exampleCta")}
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <Banners report={report} blocked={blocked} platformName={platformName} />

      <section aria-labelledby="grade-title" className="bg-card flex flex-col items-center gap-6 rounded-2xl border p-6 sm:flex-row">
        <div
          aria-hidden="true"
          className="bg-primary text-primary-foreground flex size-24 shrink-0 items-center justify-center rounded-full text-5xl font-bold"
        >
          {grade}
        </div>
        <div className="flex flex-col gap-1 text-center sm:text-start">
          <h2 id="grade-title" className="text-2xl font-semibold">
            {t("grade", { grade })}
          </h2>
          <p className="text-lg">{t(`gradeSummary.${grade}`)}</p>
          <p className="text-muted-foreground">{t("overall", { score: num(report.scores.overall) })}</p>
        </div>
      </section>

      <section aria-labelledby="scores-title" className="flex flex-col gap-4">
        <h2 id="scores-title" className="text-xl font-semibold">
          {t("categoriesTitle")}
        </h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categorySchema.options.map((category) => {
            const value = report.scores[category];
            const name = t(`categories.${category}`);
            const text = value === null ? t("notChecked") : t("score", { score: num(value) });
            return (
              <li key={category} className="bg-card flex flex-col items-center gap-2 rounded-xl border p-4 text-center">
                <ScoreRing value={value} display={value === null ? "–" : num(value)} label={`${name}: ${text}`} />
                <span className="font-medium">{name}</span>
                {value === null && <span className="text-muted-foreground text-sm">{t("notChecked")}</span>}
              </li>
            );
          })}
        </ul>
      </section>

      {vitals.length > 0 && (
        <section aria-labelledby="vitals-title" className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="vitals-title" className="text-xl font-semibold">
              {t("vitals.title")}
            </h2>
            <p className="text-muted-foreground text-sm">{t("vitals.source")}</p>
          </div>
          <ul className="bg-card divide-y rounded-xl border">
            {vitals.map((vital) => (
              <li key={vital.key} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                {vital.good ? (
                  <CircleCheck aria-hidden="true" className="text-good size-5 shrink-0" />
                ) : (
                  <TriangleAlert aria-hidden="true" className="text-warning size-5 shrink-0" />
                )}
                <span className="font-medium">{t(`vitals.${vital.key}`)}</span>
                <span className="ms-auto flex items-center gap-2 text-sm">
                  {vital.seconds !== undefined && (
                    <span className="tabular-nums">
                      {t("vitals.seconds", {
                        value: format.number(vital.seconds, { numberingSystem: "latn", minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                      })}
                    </span>
                  )}
                  <span className={vital.good ? "text-good font-medium" : "text-warning font-medium"}>
                    {vital.good ? t("vitals.good") : t("vitals.needsWork")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="fix-first-title" className="border-primary/30 bg-primary/5 flex flex-col gap-4 rounded-2xl border p-6">
        <div className="flex flex-col gap-1">
          <h2 id="fix-first-title" className="text-xl font-semibold">
            {t("fixFirst.title")}
          </h2>
          <p className="text-muted-foreground">{firstFixes.length > 0 ? t("fixFirst.intro") : t("fixFirst.none")}</p>
        </div>
        {firstFixes.length > 0 && (
          <ol className="flex flex-col gap-3">
            {firstFixes.map((issue, index) => {
              const kb = entry(issue);
              return (
                <li key={issue.id} className="bg-card flex gap-4 rounded-xl border p-4">
                  <span aria-hidden="true" className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full font-bold">
                    {num(index + 1)}
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold">{kb.title}</h3>
                    <p className="text-muted-foreground">{kb.businessImpact}</p>
                    <a href={`#${issueAnchor(issue.id)}`} className="text-primary w-fit text-sm font-medium underline-offset-4 hover:underline">
                      {t("fixFirst.details")}
                      <span className="sr-only">: {kb.title}</span>
                    </a>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {failed.length > 0 && (
        <section aria-labelledby="developer-title" className="bg-card flex flex-col gap-3 rounded-2xl border p-6">
          <div className="flex flex-col gap-1">
            <h2 id="developer-title" className="text-xl font-semibold">
              {t("developer.title")}
            </h2>
            <p className="text-muted-foreground">{t("developer.intro")}</p>
          </div>
          <DeveloperMessage messages={await developerMessages(report, routeId, locale)} />
        </section>
      )}

      {failed.length > 0 && (
        <section aria-labelledby="issues-title" className="flex flex-col gap-6">
          <h2 id="issues-title" className="text-xl font-semibold">
            {t("groups.title")}
          </h2>
          {SEVERITIES.map((severity) => {
            const group = failed.filter((issue) => issue.severity === severity);
            if (group.length === 0) return null;
            return (
              <section key={severity} aria-labelledby={`group-${severity}`} className="flex flex-col gap-3">
                <h3 id={`group-${severity}`} className="flex items-center gap-2 text-lg font-semibold">
                  <SeverityIcon severity={severity} />
                  {t(`groups.${severity}`)}
                  <span className="bg-muted rounded-full px-2 text-sm font-medium tabular-nums">
                    <span className="sr-only">{t("groups.count")}: </span>
                    {num(group.length)}
                  </span>
                </h3>
                {group.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} entry={entry(issue)} platformName={platformName} />
                ))}
              </section>
            );
          })}
        </section>
      )}

      {passed.length > 0 && (
        <section aria-labelledby="passed-title" className="flex flex-col gap-3">
          <h2 id="passed-title" className="flex items-center gap-2 text-xl font-semibold">
            <CircleCheck aria-hidden="true" className="text-good size-5" />
            {t("passed.title")}
            <span className="bg-muted rounded-full px-2 text-sm font-medium tabular-nums">{num(passed.length)}</span>
          </h2>
          <p className="text-muted-foreground">{t("passed.intro")}</p>
          {/* KB titles describe problems, so passed checks are summarized as counts per area. */}
          <ul className="grid gap-2 sm:grid-cols-2">
            {categorySchema.options.map((category) => {
              const count = passed.filter((issue) => issue.category === category).length;
              if (count === 0) return null;
              return (
                <li key={category} className="bg-card flex items-center gap-2 rounded-lg border px-3 py-2">
                  <CircleCheck aria-hidden="true" className="text-good size-4 shrink-0" />
                  <span>{t(`categories.${category}`)}</span>
                  <span className="bg-muted ms-auto rounded-full px-2 text-sm font-medium tabular-nums">{num(count)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <footer className="text-muted-foreground flex flex-col gap-1 border-t pt-4 text-sm">
        <p>{t("scope")}</p>
        {!isExample && <p>{t("expires", { date: formatDate(reportExpiresAt(report)) })}</p>}
      </footer>
    </div>
  );
}

async function Banners({ report, blocked, platformName }: { report: Report; blocked: number | null; platformName?: string }) {
  const t = await getTranslations("Report.banners");
  const banners: { key: string; title: string; body: string; warn: boolean }[] = [];
  if (report.partial?.psiFailed) banners.push({ key: "psi", title: t("psiFailedTitle"), body: t("psiFailed"), warn: true });
  if (report.partial?.htmlFailed) banners.push({ key: "html", title: t("htmlFailedTitle"), body: t("htmlFailed"), warn: true });
  if (blocked !== null) banners.push({ key: "blocked", title: t("blockedTitle"), body: t("blocked", { status: String(blocked) }), warn: true });
  if (report.partial?.jsShellSuspected) banners.push({ key: "js", title: t("jsShellTitle"), body: t("jsShell"), warn: true });

  if (banners.length === 0 && !platformName) return null;
  return (
    <div className="flex flex-col gap-3">
      {banners.map((banner) => (
        <Alert key={banner.key} className="border-warning/40">
          <TriangleAlert aria-hidden="true" className="text-warning" />
          <AlertTitle>{banner.title}</AlertTitle>
          <AlertDescription>{banner.body}</AlertDescription>
        </Alert>
      ))}
      {platformName && (
        // Informational, not an alert: role="note" instead of the Alert's default role="alert".
        <Alert role="note">
          <Info aria-hidden="true" />
          <AlertDescription>{t("platform", { platform: platformName })}</AlertDescription>
        </Alert>
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
