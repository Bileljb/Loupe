"use client";

import { useId, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuditErrorAlert } from "./AuditErrorAlert";
import { AuditProgress } from "./AuditProgress";
import { useAuditRunner } from "./useAuditRunner";

export function AuditForm() {
  const t = useTranslations("AuditForm");
  const { state, run } = useAuditRunner();
  const ids = { url: useId(), error: useId(), local: useId(), localHint: useId() };
  const running = state.phase === "running";

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void run({ url: String(data.get("url") ?? ""), localChecks: data.get("localChecks") === "on" });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <label htmlFor={ids.url} className="font-medium">
            {t("urlLabel")}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id={ids.url}
              name="url"
              type="text"
              inputMode="url"
              autoComplete="url"
              autoCapitalize="none"
              spellCheck={false}
              required
              dir="ltr"
              placeholder={t("urlPlaceholder")}
              disabled={running}
              aria-invalid={state.phase === "error" ? true : undefined}
              aria-describedby={state.phase === "error" ? ids.error : undefined}
              className="h-12 text-start text-base sm:flex-1"
            />
            <Button type="submit" size="lg" disabled={running} className="h-12 px-6 text-base">
              {running ? t("submitting") : t("submit")}
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input
            id={ids.local}
            name="localChecks"
            type="checkbox"
            disabled={running}
            aria-describedby={ids.localHint}
            className="accent-primary mt-1 size-4 shrink-0"
          />
          <div className="flex flex-col gap-0.5">
            <label htmlFor={ids.local} className="font-medium">
              {t("localLabel")}
            </label>
            <p id={ids.localHint} className="text-muted-foreground text-sm">
              {t("localHint")}
            </p>
          </div>
        </div>
      </form>

      {state.phase === "error" && (
        <AuditErrorAlert id={ids.error} title={t("errorTitle")} code={state.code} retryAfter={state.retryAfter} />
      )}

      {state.phase === "running" && <AuditProgress steps={state.steps} />}
    </div>
  );
}
