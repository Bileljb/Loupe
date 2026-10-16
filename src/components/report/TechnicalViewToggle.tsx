"use client";

import { useEffect, useId, useSyncExternalStore } from "react";

const STORAGE_KEY = "loupe:technical-view";
const listeners = new Set<() => void>();
// Fallback when storage is blocked (private mode, disabled cookies): the switch still works for this visit.
let memoryValue: boolean | null = null;

function read(): boolean {
  if (memoryValue !== null) return memoryValue;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

function write(value: boolean) {
  memoryValue = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "on" : "off");
  } catch {
    // Remembered for this visit only.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Opens or closes every "Developer details" panel at once. Off by default, remembered per viewer. */
export function TechnicalViewToggle({ label, hint }: { label: string; hint: string }) {
  const on = useSyncExternalStore(subscribe, read, () => false);
  const labelId = useId();
  const hintId = useId();

  useEffect(() => {
    // The panels are server-rendered <details>; set their open state directly.
    document.querySelectorAll<HTMLDetailsElement>("details[data-dev-details]").forEach((details) => {
      details.open = on;
    });
  }, [on]);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={labelId}
        aria-describedby={hintId}
        onClick={() => write(!on)}
        // The knob sits at the start when off and the end when on, so RTL mirrors it for free.
        className="focus-visible:ring-ring/50 bg-muted aria-checked:bg-primary inline-flex h-6 w-11 shrink-0 items-center justify-start rounded-full border p-0.5 transition-colors outline-none focus-visible:ring-3 aria-checked:justify-end"
      >
        <span aria-hidden="true" className="bg-background inline-block size-5 rounded-full shadow" />
      </button>
      <div className="flex flex-col">
        <span id={labelId} className="text-sm font-medium">
          {label}
        </span>
        <span id={hintId} className="text-muted-foreground text-xs">
          {hint}
        </span>
      </div>
    </div>
  );
}
