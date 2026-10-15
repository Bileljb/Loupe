import type { Issue } from "@/lib/schemas";
import { accessibilityChecks } from "./accessibility";
import { detectJsShell } from "./jsShell";
import { localChecks } from "./local";
import { parsePage, type PageSnapshot } from "./page";
import { detectPlatform, type PlatformDetection } from "./platform";
import { seoChecks } from "./seo";
import { technicalChecks } from "./technical";

export type HtmlCheckResult = {
  issues: Issue[];
  platform: PlatformDetection;
  jsShellSuspected: boolean;
};

/** Runs every HTML-based check on one snapshot. Pure: no I/O, safe to move into a worker. */
export function runHtmlChecks(snapshot: PageSnapshot, options: { localChecks: boolean }): HtmlCheckResult {
  const page = parsePage(snapshot);
  return {
    issues: [
      ...seoChecks(page),
      ...technicalChecks(page),
      ...accessibilityChecks(page),
      // Local checks are only added when opted in, so they never affect the score otherwise.
      ...(options.localChecks ? localChecks(page) : []),
    ],
    platform: detectPlatform(page.html, page.headers, page.$),
    jsShellSuspected: detectJsShell(page),
  };
}

export type { PageSnapshot, SiteFile } from "./page";
export { checkIds, checkRegistry, type CheckId } from "./registry";
