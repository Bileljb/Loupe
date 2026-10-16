"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  /** Text to copy; defaults to the current page address. */
  text?: string;
  label: string;
  copiedLabel: string;
  failedLabel: string;
  variant?: "default" | "outline";
};

export function CopyButton({ text, label, copiedLabel, failedLabel, variant = "outline" }: Props) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text ?? window.location.href);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant={variant} onClick={copy}>
        {status === "copied" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {status === "copied" ? copiedLabel : label}
      </Button>
      <p role="status" className="text-muted-foreground text-sm empty:hidden">
        {status === "failed" ? failedLabel : null}
      </p>
    </div>
  );
}
