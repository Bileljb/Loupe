"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEME_STORAGE_KEY } from "./ThemeScript";

type Theme = "system" | "light" | "dark";
const THEMES: { value: Theme; icon: typeof Sun }[] = [
  { value: "system", icon: Monitor },
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
];

const listeners = new Set<() => void>();
// Fallback when storage is blocked: the switch still works for this visit.
let memoryTheme: Theme | null = null;

function read(): Theme {
  if (memoryTheme) return memoryTheme;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function apply(theme: Theme) {
  memoryTheme = theme;
  try {
    if (theme === "system") window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Remembered for this visit only.
  }
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme !== "system") root.classList.add(theme);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** System / light / dark, as a small radio group. Off-system choices are remembered per visitor. */
export function ThemeToggle() {
  const t = useTranslations("Nav");
  const current = useSyncExternalStore(subscribe, read, () => "system" as Theme);

  return (
    <div role="radiogroup" aria-label={t("themeLabel")} className="bg-muted/70 flex items-center gap-0.5 rounded-full border p-0.5">
      {THEMES.map(({ value, icon: Icon }) => {
        const checked = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={checked}
            title={t(`theme.${value}`)}
            onClick={() => apply(value)}
            className={cn(
              "text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 flex size-7 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-3",
              checked && "bg-background text-foreground shadow-sm",
            )}
          >
            <Icon aria-hidden="true" className="size-3.5" />
            <span className="sr-only">{t(`theme.${value}`)}</span>
          </button>
        );
      })}
    </div>
  );
}
