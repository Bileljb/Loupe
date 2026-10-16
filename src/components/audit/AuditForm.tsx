"use client";

import { useId, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, CircleX, Circle, LoaderCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/navigation";
import { readAuditEvents, type AuditErrorCode } from "@/lib/audit/events";

type StepKey = "performance" | "page" | "saving";
type StepStatus = "pending" | "running" | "done" | "failed";
type Steps = Record<StepKey, StepStatus>;

const STEP_KEYS: StepKey[] = ["performance", "page", "saving"];
const initialSteps: Steps = { performance: "running", page: "running", saving: "pending" };

type State =
  | { phase: "idle" }
  | { phase: "running"; steps: Steps }
  | { phase: "error"; code: AuditErrorCode };

export function AuditForm() {
  const t = useTranslations("AuditForm");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [state, setState] = useState<State>({ phase: "idle" });
  const ids = { url: useId(), hint: useId(), error: useId(), local: useId(), localHint: useId() };
  const running = state.phase === "running";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    let steps: Steps = { ...initialSteps };
    setState({ phase: "running", steps });

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: String(data.get("url") ?? ""), localChecks: data.get("localChecks") === "on" }),
      });
      if (!response.body) throw new Error("empty response");

      for await (const message of readAuditEvents(response.body)) {
        if (message.type === "stage") {
          steps = { ...steps, [message.stage]: message.status };
          if (steps.performance !== "running" && steps.page !== "running") steps = { ...steps, saving: "running" };
          setState({ phase: "running", steps });
        } else if (message.type === "done") {
          // A cached result skips the stage events: mark whatever is still running as done.
          const finish = (status: StepStatus): StepStatus => (status === "failed" ? "failed" : "done");
          setState({
            phase: "running",
            steps: { performance: finish(steps.performance), page: finish(steps.page), saving: "done" },
          });
          router.push(`/report/${message.id}`);
          return;
        } else if (message.type === "error") {
          setState({ phase: "error", code: message.code });
          return;
        }
      }
      // The stream ended without a result (connection dropped, function timed out).
      setState({ phase: "error", code: "SERVER_ERROR" });
    } catch {
      setState({ phase: "error", code: "SERVER_ERROR" });
    }
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
        <Alert variant="destructive" id={ids.error}>
          <CircleX aria-hidden="true" />
          <AlertTitle>{t("errorTitle")}</AlertTitle>
          <AlertDescription>{tErrors(state.code)}</AlertDescription>
        </Alert>
      )}

      {state.phase === "running" && <Progress steps={state.steps} />}
    </div>
  );
}

function Progress({ steps }: { steps: Steps }) {
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
