import type { Report } from "@/lib/schemas";
import { getReportStorage, type ReportStorage } from "@/lib/storage/reports";
import { parseAuditInput, runAudit, type AuditOptions } from "./runAudit";

export type AuditAndSaveOptions = Omit<AuditOptions, "previousReportId"> & {
  /**
   * Id of the report being re-scanned. The previous report's own URL and local-checks setting
   * are reused, so a re-scan can only ever be linked to a report of the same page.
   * Re-scans always skip the cache so the owner sees the effect of their fixes.
   */
  rescanOf?: string;
  storage?: ReportStorage;
};

export type AuditAndSaveResult = { report: Report; cached: boolean };

/**
 * Runs an audit and stores the report so it can be shared, reusing a report of the same page
 * from the last hour to protect PSI quota. Cache problems never fail an audit; a failed save does,
 * because without it there is no link to show.
 */
export async function auditAndSave(
  input: { url: string; localChecks?: boolean },
  options: AuditAndSaveOptions = {},
): Promise<AuditAndSaveResult> {
  const { rescanOf, storage = getReportStorage(), ...auditOptions } = options;
  const isRescan = rescanOf !== undefined;
  const previous = isRescan ? await readPrevious(storage, rescanOf) : null;
  // An expired previous report degrades to a plain fresh audit of the requested page.
  const { url, localChecks } = parseAuditInput(
    previous ? { url: previous.url, localChecks: previous.localChecks } : input,
  );

  if (!isRescan) {
    const cached = await readCache(storage, url, localChecks);
    if (cached) return { report: cached, cached: true };
  }

  const report = await runAudit(
    { url, localChecks },
    { ...auditOptions, ...(previous ? { previousReportId: previous.id } : {}) },
  );
  await storage.saveReport(report);

  // A partial report (e.g. PSI quota hit) shouldn't be handed out for an hour; let the next try retry.
  // Re-scans aren't cached either: their compare view belongs to the person who re-scanned.
  const complete = !report.partial?.psiFailed && !report.partial?.htmlFailed;
  if (complete && !isRescan) {
    await storage.setCachedReportId(url, localChecks, report.id).catch(() => {});
  }
  return { report, cached: false };
}

async function readPrevious(storage: ReportStorage, id: string): Promise<Report | null> {
  try {
    const result = await storage.getReport(id);
    return result.status === "found" ? result.report : null;
  } catch {
    return null;
  }
}

async function readCache(storage: ReportStorage, url: string, localChecks: boolean): Promise<Report | null> {
  try {
    const id = await storage.getCachedReportId(url, localChecks);
    return id ? await readPrevious(storage, id) : null;
  } catch {
    return null;
  }
}
