import type { CheerioAPI } from "cheerio";
import type { Issue } from "@/lib/schemas";
import { collapseWhitespace, MAX_EVIDENCE_ITEMS, truncate, type ParsedPage, type Selection } from "./page";
import { makeIssue } from "./registry";

const UNLABELED_INPUT_TYPES = new Set(["hidden", "submit", "button", "reset", "image"]);

function isHidden(node: Selection): boolean {
  return node.attr("aria-hidden") === "true" || node.is("[hidden]") || node.closest('[aria-hidden="true"]').length > 0;
}

function hasText(value: string | undefined): boolean {
  return Boolean(value && value.trim());
}

/** Matches attribute values by comparison, never by building a selector from untrusted text. */
function withAttribute($: CheerioAPI, selector: string, attribute: string, value: string): Selection {
  return $(selector).filter((_, el) => $(el).attr(attribute) === value);
}

/** Rough accessible name: visible text, ARIA naming, title, or alt text of images inside. */
function hasAccessibleName($: CheerioAPI, node: Selection): boolean {
  if (hasText(collapseWhitespace(node.text()))) return true;
  if (hasText(node.attr("aria-label")) || hasText(node.attr("title"))) return true;
  const labelledBy = node.attr("aria-labelledby")?.split(/\s+/).filter(Boolean) ?? [];
  if (labelledBy.some((id) => hasText(withAttribute($, "[id]", "id", id).text()))) return true;
  if (node.find("img[alt]").toArray().some((img) => hasText($(img).attr("alt")))) return true;
  if (node.find("[aria-label]").toArray().some((child) => hasText($(child).attr("aria-label")))) return true;
  return hasText(node.find("svg title").first().text());
}

/** Short, non-sensitive description of an element for developer details. */
function describe(node: Selection): string {
  const tag = node.prop("tagName")?.toLowerCase() ?? "element";
  const parts = ["id", "name", "type", "href", "src"]
    .map((attribute) => [attribute, node.attr(attribute)] as const)
    .filter(([, value]) => value)
    .map(([attribute, value]) => `${attribute}="${truncate(value ?? "", 80)}"`);
  return truncate(`<${[tag, ...parts].join(" ")}>`, 160);
}

function failures(examples: string[]): Record<string, unknown> | undefined {
  return examples.length ? { count: examples.length, examples: examples.slice(0, MAX_EVIDENCE_ITEMS) } : undefined;
}

function imagesWithoutAlt({ $ }: ParsedPage): string[] {
  return $("img:not([alt])")
    .toArray()
    .map((el) => $(el))
    .filter((img) => !isHidden(img) && !/^(presentation|none)$/i.test(img.attr("role") ?? ""))
    .map(describe);
}

function unlabeledFields({ $ }: ParsedPage): string[] {
  return $("input, select, textarea")
    .toArray()
    .map((el) => $(el))
    .filter((field) => {
      if (UNLABELED_INPUT_TYPES.has((field.attr("type") ?? "").toLowerCase()) || isHidden(field)) return false;
      if (hasText(field.attr("aria-label")) || hasText(field.attr("aria-labelledby")) || hasText(field.attr("title"))) {
        return false;
      }
      if (field.closest("label").length > 0) return false;
      const id = field.attr("id");
      return !(id && withAttribute($, "label[for]", "for", id).length > 0);
    })
    .map(describe);
}

function emptyLinks({ $ }: ParsedPage): string[] {
  return $("a[href]")
    .toArray()
    .map((el) => $(el))
    .filter((link) => !isHidden(link) && !hasAccessibleName($, link))
    .map(describe);
}

function emptyButtons({ $ }: ParsedPage): string[] {
  const buttons = $('button, [role="button"]:not(input)')
    .toArray()
    .map((el) => $(el))
    .filter((button) => !isHidden(button) && !hasAccessibleName($, button));
  // <input type="image"> needs alt; submit/reset/button inputs get a default name from the browser.
  const imageInputs = $('input[type="image" i]')
    .toArray()
    .map((el) => $(el))
    .filter((input) => !isHidden(input) && !hasText(input.attr("alt")) && !hasText(input.attr("aria-label")));
  return [...buttons, ...imageInputs].map(describe);
}

export function accessibilityChecks(page: ParsedPage): Issue[] {
  const lang = page.$("html").attr("lang")?.trim();
  const missingAlt = imagesWithoutAlt(page);
  const unlabeled = unlabeledFields(page);
  const links = emptyLinks(page);
  const buttons = emptyButtons(page);

  return [
    makeIssue("accessibility.img-alt.missing", missingAlt.length === 0, failures(missingAlt)),
    makeIssue("accessibility.form-label.missing", unlabeled.length === 0, failures(unlabeled)),
    makeIssue("accessibility.link-name.missing", links.length === 0, failures(links)),
    makeIssue("accessibility.button-name.missing", buttons.length === 0, failures(buttons)),
    makeIssue("accessibility.lang.missing", Boolean(lang), { lang: lang ? truncate(lang, 40) : null }),
  ];
}
