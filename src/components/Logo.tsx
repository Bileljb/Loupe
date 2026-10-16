import { useId } from "react";
import { cn } from "@/lib/utils";

/** The loupe mark: a lens with a score arc and a handle. Decorative; pair it with the name. */
export function LogoMark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-7", className)}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--glow)" />
        </linearGradient>
      </defs>
      <circle cx="14" cy="14" r="9.5" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
      <path d="M14 4.5a9.5 9.5 0 0 1 9.2 11.9" fill="none" stroke={`url(#${id}-g)`} strokeWidth="3" strokeLinecap="round" />
      <path d="M21.2 21.2 27 27" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}
