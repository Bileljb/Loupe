"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { CopyButton } from "./CopyButton";

type Props = {
  /** Message per language, built from the report. The current language comes first. */
  messages: { locale: string; name: string; text: string }[];
};

/** "Send to my developer": a ready-to-paste technical to-do list. No server call, no AI. */
export function DeveloperMessage({ messages }: Props) {
  const t = useTranslations("Report.developer");
  const [index, setIndex] = useState(0);
  const ids = { language: useId(), message: useId() };
  const current = messages[index] ?? messages[0];
  if (!current) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        {messages.length > 1 && (
          <div className="flex flex-col gap-1">
            <label htmlFor={ids.language} className="text-sm font-medium">
              {t("language")}
            </label>
            <select
              id={ids.language}
              value={index}
              onChange={(event) => setIndex(Number(event.target.value))}
              className="border-input bg-background focus-visible:ring-ring/50 h-9 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
            >
              {messages.map((message, i) => (
                <option key={message.locale} value={i} lang={message.locale}>
                  {message.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <CopyButton text={current.text} label={t("copy")} copiedLabel={t("copied")} failedLabel={t("copyFailed")} variant="default" />
      </div>
      <details className="group">
        <summary className="text-primary w-fit cursor-pointer text-sm font-medium underline-offset-4 hover:underline">
          {t("preview")}
        </summary>
        <label htmlFor={ids.message} className="sr-only">
          {t("messageLabel")}
        </label>
        <textarea
          id={ids.message}
          readOnly
          value={current.text}
          lang={current.locale}
          dir="auto"
          rows={14}
          className="border-input bg-muted/40 mt-3 w-full rounded-lg border p-3 font-mono text-xs"
        />
      </details>
    </div>
  );
}
