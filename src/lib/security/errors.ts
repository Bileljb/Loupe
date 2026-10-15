// Error codes are the only failure detail that reaches the client; each maps to Errors.<code> in messages/*.json.
export const fetchErrorCodes = [
  "INVALID_URL",
  "BLOCKED",
  "TIMEOUT",
  "NOT_HTML",
  "TOO_LARGE",
  "UNREACHABLE",
  "TOO_MANY_REDIRECTS",
] as const;

export type FetchErrorCode = (typeof fetchErrorCodes)[number];

export class FetchError extends Error {
  readonly code: FetchErrorCode;

  constructor(code: FetchErrorCode, options?: { cause?: unknown }) {
    super(code, options);
    this.name = "FetchError";
    this.code = code;
  }
}
