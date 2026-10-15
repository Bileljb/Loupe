import { load } from "cheerio";
import { collapseWhitespace, type ParsedPage } from "./page";

export const JS_SHELL_TEXT_THRESHOLD = 200;
const APP_ROOTS = "#root, #__next, #app, #__nuxt, #___gatsby, app-root, [data-reactroot]";

/**
 * True when the HTML looks like an empty shell that JavaScript fills in later. We don't run
 * JavaScript, so results for such pages are incomplete and the report says so.
 */
export function detectJsShell({ html }: ParsedPage): boolean {
  // Parse a separate copy: removing nodes must not affect the tree other checks use.
  const $ = load(html);
  const hasScripts = $("script").length > 0;
  $("script, style, noscript, template, svg").remove();

  const text = collapseWhitespace($("body").text());
  const hasTitle = Boolean(collapseWhitespace($("title").text()));
  const hasH1 = Boolean(collapseWhitespace($("h1").text()));
  const emptyRoot = $(APP_ROOTS)
    .toArray()
    .some((el) => collapseWhitespace($(el).text()) === "");

  return hasScripts && text.length < JS_SHELL_TEXT_THRESHOLD && (!hasTitle || !hasH1 || emptyRoot);
}
