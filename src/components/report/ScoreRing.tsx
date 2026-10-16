import { cn } from "@/lib/utils";

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Same bands as Google's own reports: 90+ good, 50-89 needs work, below 50 poor. */
function band(value: number): string {
  if (value >= 90) return "text-good";
  if (value >= 50) return "text-warning";
  return "text-critical";
}

type Props = {
  /** Whole number 0-100, or null when the area wasn't checked. */
  value: number | null;
  /** Text inside the ring (already formatted for the locale). */
  display: string;
  /** Full accessible description, e.g. "Speed on phones: 74 out of 100". */
  label: string;
  className?: string;
};

export function ScoreRing({ value, display, label, className }: Props) {
  const filled = value === null ? 0 : (Math.max(0, Math.min(100, value)) / 100) * CIRCUMFERENCE;
  return (
    <div role="img" aria-label={label} className={cn("relative size-24 shrink-0", className)}>
      {/* Mirrored in RTL so the arc grows in the reading direction. */}
      <svg viewBox="0 0 100 100" className="size-full -rotate-90 rtl:-scale-y-100" aria-hidden="true">
        <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="8" className="stroke-muted" />
        {value !== null && (
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            stroke="currentColor"
            strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
            className={cn(band(value), "motion-safe:transition-[stroke-dasharray] motion-safe:duration-700")}
          />
        )}
      </svg>
      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums">
        {display}
      </span>
    </div>
  );
}
