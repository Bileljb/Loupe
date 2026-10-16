"use client";

import { useTranslations } from "next-intl";
import { Check, Circle, LoaderCircle, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepKey, StepStatus, Steps } from "./useAuditRunner";

const STEP_KEYS: StepKey[] = ["performance", "page", "saving"];

/** Real loading stages, driven by the streamed progress events. */
export function AuditProgress({ steps }: { steps: Steps }) {
  const t = useTranslations("AuditForm");
  return (
    <section
      aria-labelledby="audit-progress"
      className="bg-card shadow-soft animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden rounded-2xl border p-5 text-start duration-500"
    >
      {/* Indeterminate bar: says "working" without inventing a percentage. */}
      <div aria-hidden="true" className="bg-muted absolute inset-x-0 top-0 h-1 overflow-hidden">
        <div className="bg-primary h-full w-2/5 rounded-full motion-safe:animate-[progress-sweep_1.6s_ease-in-out_infinite]" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 id="audit-progress" className="font-semibold">
          {t("progressTitle")}
        </h2>
        <p className="text-muted-foreground text-sm">{t("duration")}</p>
      </div>
      {/* Announced to screen readers as each step changes. */}
      <ol className="mt-4 flex flex-col gap-1" aria-live="polite">
        {STEP_KEYS.map((key) => (
          <li
            key={key}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
              steps[key] === "running" && "bg-primary/5",
            )}
          >
            <StepIcon status={steps[key]} />
            <span className={cn("flex-1", steps[key] === "pending" && "text-muted-foreground")}>{t(`stages.${key}`)}</span>
            <span className="text-muted-foreground text-xs font-medium">{t(`status.${steps[key]}`)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "running":
      return <LoaderCircle aria-hidden="true" className="text-primary size-5 shrink-0 motion-safe:animate-spin" />;
    case "done":
      return (
        <span className="bg-good/15 text-good flex size-5 shrink-0 items-center justify-center rounded-full">
          <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
        </span>
      );
    case "failed":
      return <TriangleAlert aria-hidden="true" className="text-warning size-5 shrink-0" />;
    default:
      return <Circle aria-hidden="true" className="text-muted-foreground/60 size-5 shrink-0" />;
  }
}
