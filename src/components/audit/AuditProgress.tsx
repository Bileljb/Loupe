"use client";

import { useTranslations } from "next-intl";
import { Circle, CircleCheck, CircleX, LoaderCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { StepKey, StepStatus, Steps } from "./useAuditRunner";

const STEP_KEYS: StepKey[] = ["performance", "page", "saving"];

/** Real loading stages, driven by the streamed progress events. */
export function AuditProgress({ steps }: { steps: Steps }) {
  const t = useTranslations("AuditForm");
  return (
    <section aria-labelledby="audit-progress" className="bg-card flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex flex-col gap-1">
        <h2 id="audit-progress" className="font-semibold">
          {t("progressTitle")}
        </h2>
        <p className="text-muted-foreground text-sm">{t("duration")}</p>
      </div>
      {/* Announced to screen readers as each step changes. */}
      <ol className="flex flex-col gap-3" aria-live="polite">
        {STEP_KEYS.map((key) => (
          <li key={key} className="flex items-center gap-3">
            <StepIcon status={steps[key]} />
            <span className={steps[key] === "pending" ? "text-muted-foreground" : undefined}>{t(`stages.${key}`)}</span>
            <span className="text-muted-foreground ms-auto text-sm">{t(`status.${steps[key]}`)}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-2" aria-hidden="true">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-20 w-full" />
      </div>
    </section>
  );
}

function StepIcon({ status }: { status: StepStatus }) {
  const className = "size-5 shrink-0";
  switch (status) {
    case "running":
      return <LoaderCircle aria-hidden="true" className={`${className} text-primary animate-spin`} />;
    case "done":
      return <CircleCheck aria-hidden="true" className={`${className} text-good`} />;
    case "failed":
      return <CircleX aria-hidden="true" className={`${className} text-warning`} />;
    default:
      return <Circle aria-hidden="true" className={`${className} text-muted-foreground`} />;
  }
}
