"use client";

import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { AuditErrorAlert } from "@/components/audit/AuditErrorAlert";
import { AuditProgress } from "@/components/audit/AuditProgress";
import { useAuditRunner } from "@/components/audit/useAuditRunner";
import { Button } from "@/components/ui/button";

/** Fresh audit of the same page (no cache), linked to this report for the compare view. */
export function RescanButton({ reportId, url, localChecks }: { reportId: string; url: string; localChecks: boolean }) {
  const t = useTranslations("Report.rescan");
  const { state, run } = useAuditRunner();
  const running = state.phase === "running";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-start gap-1">
        <Button type="button" onClick={() => void run({ url, localChecks, rescanOf: reportId })} disabled={running}>
          <RefreshCw aria-hidden="true" className={running ? "motion-safe:animate-spin" : undefined} />
          {running ? t("running") : t("button")}
        </Button>
        <p className="text-muted-foreground text-sm">{t("hint")}</p>
      </div>
      {state.phase === "error" && (
        <AuditErrorAlert title={t("errorTitle")} code={state.code} retryAfter={state.retryAfter} />
      )}
      {state.phase === "running" && <AuditProgress steps={state.steps} />}
    </div>
  );
}
