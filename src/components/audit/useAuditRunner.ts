"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { readAuditEvents, type AuditErrorCode } from "@/lib/audit/events";

export type StepKey = "performance" | "page" | "saving";
export type StepStatus = "pending" | "running" | "done" | "failed";
export type Steps = Record<StepKey, StepStatus>;

export type AuditRunState =
  | { phase: "idle" }
  | { phase: "running"; steps: Steps }
  | { phase: "error"; code: AuditErrorCode; retryAfter?: number };

export type AuditRequest = { url: string; localChecks?: boolean; rescanOf?: string };

const initialSteps: Steps = { performance: "running", page: "running", saving: "pending" };

/** Posts to /api/audit, follows the streamed stages, and opens the report when it's ready. */
export function useAuditRunner() {
  const router = useRouter();
  const [state, setState] = useState<AuditRunState>({ phase: "idle" });

  async function run(request: AuditRequest) {
    let steps: Steps = { ...initialSteps };
    setState({ phase: "running", steps });

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
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
          setState({ phase: "error", code: message.code, ...(message.retryAfter ? { retryAfter: message.retryAfter } : {}) });
          return;
        }
      }
      // The stream ended without a result (connection dropped, function timed out).
      setState({ phase: "error", code: "SERVER_ERROR" });
    } catch {
      setState({ phase: "error", code: "SERVER_ERROR" });
    }
  }

  return { state, run };
}
