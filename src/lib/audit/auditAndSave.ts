import type { Report } from "@/lib/schemas";
import { getReportStorage, type ReportStorage } from "@/lib/storage/reports";
import { parseAuditInput, runAudit, type AuditOptions } from "./runAudit";

export type AuditAndSaveOptions = AuditOptions & {
  /** Re-scans skip the cache so the owner sees the effect of their fixes. */
  bypassCache?: boolean;
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
  const { bypassCache = false, storage = getReportStorage(), ...auditOptions } = options;
  const { url, localChecks } = parseAuditInput(input);

  if (!bypassCache) {
    const cached = await readCache(storage, url, localChecks);
    if (cached) return { report: cached, cached: true };
  }

  const report = await runAudit({ url, localChecks }, auditOptions);
  await storage.saveReport(report);

  // A partial report (e.g. PSI quota hit) shouldn't be handed out for an hour; let the next try retry.
  // Re-scans aren't cached either: their compare view belongs to the person who re-scanned.
  const complete = !report.partial?.psiFailed && !report.partial?.htmlFailed;
  if (complete && !report.previousReportId) {
    await storage.setCachedReportId(url, localChecks, report.id).catch(() => {});
  }
  return { report, cached: false };
}

async function readCache(storage: ReportStorage, url: string, localChecks: boolean): Promise<Report | null> {
  try {
    const id = await storage.getCachedReportId(url, localChecks);
    if (!id) return null;
    const result = await storage.getReport(id);
    return result.status === "found" ? result.report : null;
  } catch {
    return null;
  }
}
