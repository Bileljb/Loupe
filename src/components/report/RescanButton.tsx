"use client";

import { useTranslations } from "next-intl";
import { CircleX, RefreshCw } from "lucide-react";
import { AuditProgress } from "@/components/audit/AuditProgress";
import { useAuditRunner } from "@/components/audit/useAuditRunner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/** Fresh audit of the same page (no cache), linked to this report for the compare view. */
export function RescanButton({ reportId, url, localChecks }: { reportId: string; url: string; localChecks: boolean }) {
  const t = useTranslations("Report.rescan");
  const tErrors = useTranslations("Errors");
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
        <Alert variant="destructive">
          <CircleX aria-hidden="true" />
          <AlertTitle>{t("errorTitle")}</AlertTitle>
          <AlertDescription>{tErrors(state.code)}</AlertDescription>
        </Alert>
      )}
      {state.phase === "running" && <AuditProgress steps={state.steps} />}
    </div>
  );
}
