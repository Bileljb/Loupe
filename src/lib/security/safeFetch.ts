import http, { type IncomingHttpHeaders, type IncomingMessage } from "node:http";
import https from "node:https";
import type { LookupFunction } from "node:net";
import { pipeline, type Readable } from "node:stream";
import zlib from "node:zlib";
import { siteConfig } from "@/lib/siteConfig";
import { FetchError } from "./errors";
import { systemLookup, validateUrl, type LookupFn, type ResolvedAddress } from "./ssrf";

/** What is being fetched decides which content types are accepted. We never crawl. */
export type FetchKind = "html" | "robots" | "sitemap";

export type SafeFetchResult = {
  url: string; // final URL after redirects
  status: number;
  headers: Record<string, string>;
  body: string;
  redirects: { url: string; status: number }[];
};

export type HopRequest = {
  url: URL;
  addresses: ResolvedAddress[];
  kind: FetchKind;
  signal: AbortSignal;
  maxBytes: number;
};

/** One HTTP exchange, no redirect following. A redirect returns `location` and no body. */
export type HopResult = {
  status: number;
  headers: Record<string, string>;
  location?: string;
  body?: string;
};

export type Transport = (request: HopRequest) => Promise<HopResult>;

export type SafeFetchOptions = {
  kind: FetchKind;
  timeoutMs?: number;
  maxBytes?: number;
  lookup?: LookupFn;
  transport?: Transport;
};

export const MAX_REDIRECTS = 5;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
export const MAX_HEADER_BYTES = 64 * 1024;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

const ACCEPT: Record<FetchKind, string> = {
  html: "text/html,application/xhtml+xml",
  robots: "text/plain",
  sitemap: "application/xml,text/xml",
};

const ALLOWED_CONTENT_TYPES: Record<FetchKind, readonly string[]> = {
  html: ["text/html", "application/xhtml+xml"],
  robots: ["text/plain"],
  sitemap: ["application/xml", "text/xml"],
};

const DECOMPRESSORS: Record<string, () => NodeJS.ReadWriteStream> = {
  gzip: () => zlib.createGunzip(),
  "x-gzip": () => zlib.createGunzip(),
  deflate: () => zlib.createInflate(),
  br: () => zlib.createBrotliDecompress(),
};

export function isAllowedContentType(kind: FetchKind, contentType: string | undefined): boolean {
  const mediaType = contentType?.split(";")[0]?.trim().toLowerCase();
  return mediaType !== undefined && ALLOWED_CONTENT_TYPES[kind].includes(mediaType);
}

function flattenHeaders(headers: IncomingHttpHeaders): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    if (value !== undefined) flat[name] = Array.isArray(value) ? value.join(", ") : value;
  }
  return flat;
}

function decodeText(bytes: Buffer, contentType: string | undefined): string {
  const charset = contentType?.match(/charset\s*=\s*"?([^";\s]+)/i)?.[1];
  try {
    return new TextDecoder(charset ?? "utf-8").decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

/** Forces the socket to connect to the already-validated addresses (DNS-rebinding protection). */
function pinnedLookup(addresses: ResolvedAddress[]): LookupFunction {
  return (_hostname, options, callback) => {
    const first = addresses[0];
    if (!first) {
      callback(new Error("No validated address"), "", 0);
    } else if (options.all) {
      callback(null, addresses.map(({ address, family }) => ({ address, family })));
    } else {
      callback(null, first.address, first.family);
    }
  };
}

async function readBody(
  res: IncomingMessage,
  headers: Record<string, string>,
  maxBytes: number,
): Promise<string> {
  const encoding = (headers["content-encoding"] ?? "identity").trim().toLowerCase();
  const createDecompressor = DECOMPRESSORS[encoding];
  if (!createDecompressor && encoding !== "identity") {
    res.destroy();
    throw new FetchError("UNREACHABLE");
  }
  // pipeline() propagates errors and aborts from the socket to the decompressor.
  const stream: Readable = createDecompressor
    ? (pipeline(res, createDecompressor(), () => {}) as unknown as Readable)
    : res;

  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    // Counted after decompression, so compressed "bombs" hit the cap too.
    total += buffer.length;
    if (total > maxBytes) {
      res.destroy();
      stream.destroy();
      throw new FetchError("TOO_LARGE");
    }
    chunks.push(buffer);
  }
  return decodeText(Buffer.concat(chunks), headers["content-type"]);
}

export const nodeTransport: Transport = ({ url, addresses, kind, signal, maxBytes }) =>
  new Promise<HopResult>((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const req = client.request(
      url,
      {
        method: "GET",
        headers: {
          "user-agent": siteConfig.userAgent,
          accept: ACCEPT[kind],
          "accept-encoding": "gzip, deflate, br",
        },
        lookup: pinnedLookup(addresses),
        agent: false, // no connection reuse across validations
        // Node's 16 KB default rejects real sites with large CSP/cookie headers (e.g. webflow.com).
        maxHeaderSize: MAX_HEADER_BYTES,
        signal,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const headers = flattenHeaders(res.headers);
        const location = headers["location"];

        if (REDIRECT_STATUSES.has(status) && location) {
          res.resume();
          resolve({ status, headers, location });
          return;
        }
        if (status >= 200 && status < 300 && !isAllowedContentType(kind, headers["content-type"])) {
          res.destroy();
          reject(new FetchError("NOT_HTML"));
          return;
        }
        const declaredLength = Number(headers["content-length"]);
        if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
          res.destroy();
          reject(new FetchError("TOO_LARGE"));
          return;
        }
        readBody(res, headers, maxBytes).then((body) => resolve({ status, headers, body }), reject);
      },
    );
    req.on("error", reject);
    req.end();
  });

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

function parseUrl(value: string | URL, base?: URL): URL {
  try {
    const url = new URL(value, base);
    url.hash = "";
    return url;
  } catch (error) {
    throw new FetchError("INVALID_URL", { cause: error });
  }
}

/**
 * Fetches a user-supplied URL safely: validates and pins every hop's IP, follows at most
 * MAX_REDIRECTS redirects manually, and enforces one overall timeout and a body size cap.
 * Always throws FetchError; upstream error details stay in `cause` and never reach the client.
 */
export async function safeFetch(
  input: string | URL,
  options: SafeFetchOptions,
): Promise<SafeFetchResult> {
  const {
    kind,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxBytes = DEFAULT_MAX_BYTES,
    lookup = systemLookup,
    transport = nodeTransport,
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const { signal } = controller;

  try {
    let url = parseUrl(input);
    const redirects: SafeFetchResult["redirects"] = [];

    for (;;) {
      const addresses = await abortable(validateUrl(url, lookup), signal);
      const hop = await abortable(transport({ url, addresses, kind, signal, maxBytes }), signal);

      if (hop.location === undefined) {
        return { url: url.href, status: hop.status, headers: hop.headers, body: hop.body ?? "", redirects };
      }
      if (redirects.length >= MAX_REDIRECTS) throw new FetchError("TOO_MANY_REDIRECTS");
      redirects.push({ url: url.href, status: hop.status });
      url = parseUrl(hop.location, url);
    }
  } catch (error) {
    if (error instanceof FetchError) throw error;
    if (signal.aborted) throw new FetchError("TIMEOUT", { cause: error });
    throw new FetchError("UNREACHABLE", { cause: error });
  } finally {
    clearTimeout(timer);
  }
}
