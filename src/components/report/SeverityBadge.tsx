import { Info, OctagonAlert, TriangleAlert } from "lucide-react";
import type { Severity } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const styles: Record<Severity, { icon: typeof Info; className: string }> = {
  critical: { icon: OctagonAlert, className: "text-critical border-critical/40 bg-critical/10" },
  warning: { icon: TriangleAlert, className: "text-warning border-warning/40 bg-warning/10" },
  info: { icon: Info, className: "text-info border-info/40 bg-info/10" },
};

/** Severity is never color-only: icon + text label + color. */
export function SeverityBadge({ severity, label }: { severity: Severity; label: string }) {
  const { icon: Icon, className } = styles[severity];
  return (
    <span className={cn("inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold", className)}>
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}

export function SeverityIcon({ severity, className }: { severity: Severity; className?: string }) {
  const { icon: Icon, className: color } = styles[severity];
  return <Icon aria-hidden="true" className={cn("size-5 shrink-0", color.split(" ")[0], className)} />;
}
