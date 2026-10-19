"use client";

import { useId, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Globe, LoaderCircle } from "lucide-react";
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
    <div className="flex w-full flex-col gap-5">
      <form id="audit-form" onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <label htmlFor={ids.url} className="sr-only">
          {t("urlLabel")}
        </label>
        {/* One "command bar": the field and the button share a surface. */}
        <div className="bg-card shadow-lift focus-within:border-primary/60 focus-within:ring-ring/30 flex flex-col gap-2 rounded-2xl border p-2 transition-shadow focus-within:ring-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 ps-3">
            <Globe aria-hidden="true" className="text-muted-foreground size-5 shrink-0" />
            <input
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
              className="placeholder:text-muted-foreground/80 h-12 w-full min-w-0 bg-transparent text-start text-base outline-none disabled:opacity-60 sm:text-lg"
            />
          </div>
          <button
            type="submit"
            disabled={running}
            className="bg-primary text-primary-foreground focus-visible:ring-ring/50 inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-base font-semibold shadow-sm outline-none transition-all hover:brightness-110 focus-visible:ring-3 active:translate-y-px disabled:opacity-70"
          >
            {running ? (
              <LoaderCircle aria-hidden="true" className="size-5 motion-safe:animate-spin" />
            ) : null}
            {running ? t(state.phase === "running" && state.opening ? "opening" : "submitting") : t("submit")}
            {running ? null : <ArrowRight aria-hidden="true" className="size-5 rtl:-scale-x-100" />}
          </button>
        </div>

        <label
          htmlFor={ids.local}
          className="hover:bg-muted/60 has-checked:border-primary/40 has-checked:bg-primary/5 flex w-fit cursor-pointer items-start gap-3 self-center rounded-xl border border-transparent px-3 py-2 text-start transition-colors"
        >
          <input
            id={ids.local}
            name="localChecks"
            type="checkbox"
            disabled={running}
            aria-describedby={ids.localHint}
            className="accent-primary mt-1 size-4 shrink-0"
          />
          <span className="flex flex-col gap-0.5">
            <span className="font-medium">{t("localLabel")}</span>
            <span id={ids.localHint} className="text-muted-foreground text-sm">
              {t("localHint")}
            </span>
          </span>
        </label>
      </form>

      {state.phase === "error" && (
        <AuditErrorAlert id={ids.error} title={t("errorTitle")} code={state.code} retryAfter={state.retryAfter} />
      )}

      {state.phase === "running" && <AuditProgress steps={state.steps} />}
    </div>
  );
}
