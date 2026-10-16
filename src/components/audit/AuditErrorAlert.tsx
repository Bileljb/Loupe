"use client";

import { useTranslations } from "next-intl";
import { CircleX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AuditErrorCode } from "@/lib/audit/events";

type Props = { id?: string; title: string; code: AuditErrorCode; retryAfter?: number };

export function AuditErrorAlert({ id, title, code, retryAfter }: Props) {
  const t = useTranslations("Errors");
  // Whole minutes, at least 1; Western digits in every language.
  const minutes = String(Math.max(1, Math.ceil((retryAfter ?? 60) / 60)));
  return (
    <Alert variant="destructive" id={id}>
      <CircleX aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{code === "RATE_LIMITED" ? t("RATE_LIMITED", { minutes }) : t(code)}</AlertDescription>
    </Alert>
  );
}
