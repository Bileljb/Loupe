import { getTranslations } from "next-intl/server";
import { ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { guideSlugFor } from "@/lib/guides";
import type { KbEntry } from "@/lib/kb";
import type { Issue } from "@/lib/schemas";
import { SeverityBadge } from "./SeverityBadge";

type Props = {
  issue: Issue;
  entry: KbEntry;
  /** Display name of the detected platform, when its steps are shown. */
  platformName?: string;
};

export function issueAnchor(id: string): string {
  return `issue-${id}`;
}

/** Layer 1 (owner) by default; Layer 2 (developer details) collapsed. */
export async function IssueCard({ issue, entry, platformName }: Props) {
  const t = await getTranslations("Report");
  const evidence = issue.evidence && Object.keys(issue.evidence).length > 0 ? issue.evidence : null;
  const guideSlug = guideSlugFor(issue.id);

  return (
    <article id={issueAnchor(issue.id)} aria-labelledby={`${issueAnchor(issue.id)}-title`} className="bg-card flex scroll-mt-6 flex-col gap-4 rounded-xl border p-5">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={issue.severity} label={t(`severity.${issue.severity}`)} />
          <span className="bg-muted rounded-full px-2 py-0.5 text-xs">{t(`impact.${entry.impact}`)}</span>
          <span className="bg-muted rounded-full px-2 py-0.5 text-xs">{t(`effort.${entry.effort}`)}</span>
        </div>
        <h4 id={`${issueAnchor(issue.id)}-title`} className="text-lg font-semibold">
          {entry.title}
        </h4>
      </header>

      <dl className="flex flex-col gap-3">
        <div>
          <dt className="text-sm font-medium">{t("issue.what")}</dt>
          <dd className="text-muted-foreground">{entry.what}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium">{t("issue.why")}</dt>
          <dd className="text-muted-foreground">
            {entry.why} <strong className="text-foreground font-medium">{entry.businessImpact}</strong>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium">{t("issue.howToFix")}</dt>
          <dd className="flex flex-col gap-2">
            {entry.platformFix && platformName ? (
              <>
                <div className="border-primary/40 bg-primary/5 rounded-lg border-s-4 p-3">
                  <p className="text-sm font-medium">{t("issue.platformSteps", { platform: platformName })}</p>
                  <p>{entry.platformFix}</p>
                </div>
                <p className="text-muted-foreground">
                  <span className="font-medium">{t("issue.generalFix")}: </span>
                  {entry.fix}
                </p>
              </>
            ) : (
              <p>{entry.fix}</p>
            )}
          </dd>
        </div>
      </dl>

      {guideSlug && (
        <Link href={`/guides/${guideSlug}`} className="text-primary w-fit text-sm font-medium underline-offset-4 hover:underline">
          {t("issue.guide")}
          <span className="sr-only">: {entry.title}</span>
        </Link>
      )}

      <details data-dev-details className="group rounded-lg border">
        <summary className="hover:bg-muted/50 flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
          {t("issue.devDetails")}
          <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        {/* Technical content is shown left-to-right in every language. Evidence comes from
            the audited site: rendered as text only, so React escapes it. */}
        <div className="flex flex-col gap-3 border-t px-3 py-3 text-sm">
          <p>
            <span className="font-medium">{t("issue.checkId")}: </span>
            <code dir="ltr" className="bg-muted rounded px-1 font-mono text-xs">
              {issue.id}
            </code>
          </p>
          {evidence && (
            <div className="flex flex-col gap-1">
              <p className="font-medium">{t("issue.evidence")}</p>
              <pre dir="ltr" className="bg-muted/60 max-h-72 overflow-auto rounded-md p-3 text-start font-mono text-xs whitespace-pre-wrap break-all">
                {JSON.stringify(evidence, null, 2)}
              </pre>
            </div>
          )}
          {entry.snippet && (
            <div className="flex flex-col gap-1">
              <p className="font-medium">{t("issue.example")}</p>
              <pre dir="ltr" className="bg-muted/60 overflow-auto rounded-md p-3 text-start font-mono text-xs">
                <code>{entry.snippet}</code>
              </pre>
            </div>
          )}
        </div>
      </details>
    </article>
  );
}
