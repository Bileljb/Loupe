"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

// Shown when the report can't be loaded (e.g. storage is unreachable). Never shows error details.
export default function ReportError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("ReportError");
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start gap-4 px-6 py-16 text-start">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("body")}</p>
      <Button type="button" onClick={() => retry()}>
        {t("retry")}
      </Button>
    </main>
  );
}
