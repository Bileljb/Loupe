type Field = string | number | boolean | undefined;

/**
 * One JSON line per event, readable in Vercel's logs. Callers pass only codes, counts and flags:
 * never URLs, IP addresses, report ids, upstream bodies or secrets.
 */
export function logEvent(level: "info" | "warn" | "error", event: string, fields: Record<string, Field> = {}): void {
  const line = JSON.stringify({ event, ...fields });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
