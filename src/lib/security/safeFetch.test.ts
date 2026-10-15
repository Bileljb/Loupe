import http from "node:http";
import type { AddressInfo } from "node:net";
import zlib from "node:zlib";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FetchError } from "./errors";
import {
  MAX_REDIRECTS,
  nodeTransport,
  safeFetch,
  type HopRequest,
  type HopResult,
  type Transport,
} from "./safeFetch";
import type { LookupFn } from "./ssrf";

const publicLookup: LookupFn = async () => [{ address: "93.184.215.14", family: 4 }];
const htmlHeaders = { "content-type": "text/html; charset=utf-8" };

async function codeOf(promise: Promise<unknown>) {
  try {
    await promise;
    return "OK";
  } catch (error) {
    if (error instanceof FetchError) return error.code;
    throw error;
  }
}

/** Mock transport answering by URL; unknown URLs fail the test. */
function routes(table: Record<string, HopResult>): Transport & { calls: string[] } {
  const calls: string[] = [];
  const transport = async ({ url }: HopRequest) => {
    calls.push(url.href);
    const result = table[url.href];
    if (!result) throw new Error(`unexpected request to ${url.href}`);
    return result;
  };
  return Object.assign(transport, { calls });
}

const redirect = (location: string, status = 301): HopResult => ({ status, headers: { location }, location });
const page = (body = "<html></html>"): HopResult => ({ status: 200, headers: htmlHeaders, body });

describe("safeFetch (redirects and validation)", () => {
  it("fetches a public page", async () => {
    const transport = routes({ "https://example.com/": page("<h1>hi</h1>") });
    const result = await safeFetch("https://example.com/", { kind: "html", lookup: publicLookup, transport });
    expect(result).toMatchObject({ url: "https://example.com/", status: 200, body: "<h1>hi</h1>", redirects: [] });
  });

  it("re-validates every hop and blocks a redirect to a private IP", async () => {
    const transport = routes({ "https://example.com/": redirect("http://10.0.0.1/admin") });
    expect(await codeOf(safeFetch("https://example.com/", { kind: "html", lookup: publicLookup, transport }))).toBe(
      "BLOCKED",
    );
    expect(transport.calls).toEqual(["https://example.com/"]);
  });

  it("blocks a redirect to a hostname that resolves privately", async () => {
    const lookup: LookupFn = async (host) =>
      host === "internal.example" ? [{ address: "192.168.0.10", family: 4 }] : publicLookup(host);
    const transport = routes({ "https://example.com/": redirect("https://internal.example/") });
    expect(await codeOf(safeFetch("https://example.com/", { kind: "html", lookup, transport }))).toBe("BLOCKED");
    expect(transport.calls).toHaveLength(1);
  });

  it("blocks a redirect to the cloud metadata address", async () => {
    const transport = routes({ "https://example.com/": redirect("http://169.254.169.254/latest/meta-data/", 302) });
    expect(await codeOf(safeFetch("https://example.com/", { kind: "html", lookup: publicLookup, transport }))).toBe(
      "BLOCKED",
    );
  });

  it("rejects a redirect to a non-web scheme", async () => {
    const transport = routes({ "https://example.com/": redirect("file:///etc/passwd") });
    expect(await codeOf(safeFetch("https://example.com/", { kind: "html", lookup: publicLookup, transport }))).toBe(
      "INVALID_URL",
    );
  });

  it("follows relative redirects and records the chain", async () => {
    const transport = routes({
      "http://example.com/": redirect("https://example.com/"),
      "https://example.com/": redirect("/home", 302),
      "https://example.com/home": page(),
    });
    const result = await safeFetch("http://example.com/", { kind: "html", lookup: publicLookup, transport });
    expect(result.url).toBe("https://example.com/home");
    expect(result.redirects).toEqual([
      { url: "http://example.com/", status: 301 },
      { url: "https://example.com/", status: 302 },
    ]);
  });

  it(`allows ${MAX_REDIRECTS} redirects but not ${MAX_REDIRECTS + 1}`, async () => {
    const chain = (length: number) => {
      const table: Record<string, HopResult> = {};
      for (let i = 0; i < length; i++) table[`https://example.com/${i}`] = redirect(`/${i + 1}`);
      table[`https://example.com/${length}`] = page();
      return routes(table);
    };
    const ok = await safeFetch("https://example.com/0", { kind: "html", lookup: publicLookup, transport: chain(MAX_REDIRECTS) });
    expect(ok.redirects).toHaveLength(MAX_REDIRECTS);
    expect(
      await codeOf(
        safeFetch("https://example.com/0", { kind: "html", lookup: publicLookup, transport: chain(MAX_REDIRECTS + 1) }),
      ),
    ).toBe("TOO_MANY_REDIRECTS");
  });

  it("rejects credentials in the URL without any network activity", async () => {
    const lookup = vi.fn(publicLookup);
    const transport = routes({});
    expect(await codeOf(safeFetch("https://admin:secret@example.com/", { kind: "html", lookup, transport }))).toBe(
      "INVALID_URL",
    );
    expect(lookup).not.toHaveBeenCalled();
    expect(transport.calls).toHaveLength(0);
  });

  it.each(["http://localhost/", "http://127.0.0.1/", "http://[::1]/", "file:///etc/passwd", "not a url"])(
    "never connects for %s",
    async (input) => {
      const transport = routes({});
      expect(await codeOf(safeFetch(input, { kind: "html", lookup: publicLookup, transport }))).not.toBe("OK");
      expect(transport.calls).toHaveLength(0);
    },
  );

  it("times out with one overall deadline", async () => {
    const hanging: Transport = ({ signal }) =>
      new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))));
    expect(
      await codeOf(safeFetch("https://example.com/", { kind: "html", lookup: publicLookup, transport: hanging, timeoutMs: 50 })),
    ).toBe("TIMEOUT");
  });

  it("times out when DNS hangs", async () => {
    const slowLookup: LookupFn = () => new Promise(() => {});
    expect(
      await codeOf(safeFetch("https://example.com/", { kind: "html", lookup: slowLookup, transport: routes({}), timeoutMs: 50 })),
    ).toBe("TIMEOUT");
  });

  it("hides upstream error details behind UNREACHABLE", async () => {
    const failing: Transport = async () => {
      throw new Error("connect ECONNREFUSED with secret upstream detail");
    };
    const error = await safeFetch("https://example.com/", { kind: "html", lookup: publicLookup, transport: failing }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(FetchError);
    expect((error as FetchError).code).toBe("UNREACHABLE");
    expect((error as FetchError).message).toBe("UNREACHABLE");
  });
});

describe("nodeTransport (real sockets on a local test server)", () => {
  let server: http.Server | undefined;

  afterEach(async () => {
    await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
    server = undefined;
  });

  async function serve(handler: http.RequestListener): Promise<number> {
    server = http.createServer(handler);
    await new Promise<void>((resolve) => server?.listen(0, "127.0.0.1", resolve));
    return (server?.address() as AddressInfo).port;
  }

  // The hostname never resolves via DNS: the pinned lookup sends the socket to 127.0.0.1.
  function hop(port: number, overrides: Partial<HopRequest> = {}): HopRequest {
    return {
      url: new URL(`http://pinned.test:${port}/`),
      addresses: [{ address: "127.0.0.1", family: 4 }],
      kind: "html",
      signal: new AbortController().signal,
      maxBytes: 1024,
      ...overrides,
    };
  }

  it("connects to the pinned address and sends the original Host and an honest User-Agent", async () => {
    let seen: http.IncomingHttpHeaders = {};
    const port = await serve((req, res) => {
      seen = req.headers;
      res.writeHead(200, htmlHeaders).end("<p>ok</p>");
    });
    const result = await nodeTransport(hop(port));
    expect(result.body).toBe("<p>ok</p>");
    expect(seen.host).toBe(`pinned.test:${port}`);
    expect(seen["user-agent"]).toMatch(/^LoupeBot\/1\.0 \(\+https?:\/\/.+\)$/);
  });

  it("returns redirects without reading or following them", async () => {
    const port = await serve((_req, res) => res.writeHead(302, { location: "http://10.0.0.1/" }).end());
    expect(await nodeTransport(hop(port))).toMatchObject({ status: 302, location: "http://10.0.0.1/" });
  });

  it("decompresses gzip and brotli bodies", async () => {
    const port = await serve((req, res) => {
      const br = req.url === "/br";
      res.writeHead(200, { ...htmlHeaders, "content-encoding": br ? "br" : "gzip" });
      res.end(br ? zlib.brotliCompressSync("<p>brotli</p>") : zlib.gzipSync("<p>gzip</p>"));
    });
    expect((await nodeTransport(hop(port))).body).toBe("<p>gzip</p>");
    expect((await nodeTransport(hop(port, { url: new URL(`http://pinned.test:${port}/br`) }))).body).toBe("<p>brotli</p>");
  });

  it("decodes the declared charset", async () => {
    const port = await serve((_req, res) => {
      res.writeHead(200, { "content-type": "text/html; charset=iso-8859-1" });
      res.end(Buffer.from([0x63, 0x61, 0x66, 0xe9])); // "café" in Latin-1
    });
    expect((await nodeTransport(hop(port))).body).toBe("café");
  });

  it("rejects a declared Content-Length over the cap before reading", async () => {
    const port = await serve((_req, res) => res.writeHead(200, { ...htmlHeaders, "content-length": "5000" }).end("x".repeat(5000)));
    expect(await codeOf(nodeTransport(hop(port)))).toBe("TOO_LARGE");
  });

  it("rejects a streamed body that grows past the cap", async () => {
    const port = await serve((_req, res) => {
      res.writeHead(200, htmlHeaders); // chunked, no Content-Length
      for (let i = 0; i < 10; i++) res.write("x".repeat(512));
      res.end();
    });
    expect(await codeOf(nodeTransport(hop(port)))).toBe("TOO_LARGE");
  });

  it("caps the decompressed size, not the compressed size (gzip bomb)", async () => {
    const bomb = zlib.gzipSync(Buffer.alloc(1024 * 1024, 0x61)); // ~1 KB compressed, 1 MB inflated
    const port = await serve((_req, res) => res.writeHead(200, { ...htmlHeaders, "content-encoding": "gzip" }).end(bomb));
    expect(bomb.length).toBeLessThan(5000);
    expect(await codeOf(nodeTransport(hop(port, { maxBytes: 64 * 1024 })))).toBe("TOO_LARGE");
  });

  it.each([
    ["html", "application/json"],
    ["html", "image/png"],
    ["html", undefined],
    ["robots", "text/html"],
    ["sitemap", "text/plain"],
  ] as const)("rejects %s fetches served as %s", async (kind, contentType) => {
    const port = await serve((_req, res) => {
      res.writeHead(200, contentType ? { "content-type": contentType } : {}).end("{}");
    });
    expect(await codeOf(nodeTransport(hop(port, { kind })))).toBe("NOT_HTML");
  });

  it.each([
    ["robots", "text/plain", "User-agent: *"],
    ["sitemap", "application/xml", "<urlset/>"],
    ["sitemap", "text/xml; charset=utf-8", "<urlset/>"],
  ] as const)("accepts %s served as %s", async (kind, contentType, body) => {
    const port = await serve((_req, res) => res.writeHead(200, { "content-type": contentType }).end(body));
    expect((await nodeTransport(hop(port, { kind }))).body).toBe(body);
  });

  it("returns non-2xx pages without a content-type check so callers can see the status", async () => {
    const port = await serve((_req, res) => res.writeHead(404, { "content-type": "text/html" }).end("missing"));
    expect(await nodeTransport(hop(port, { kind: "robots" }))).toMatchObject({ status: 404, body: "missing" });
  });

  it("stops when the signal aborts", async () => {
    const port = await serve(() => {
      /* never respond */
    });
    const signal = AbortSignal.timeout(50);
    await expect(nodeTransport(hop(port, { signal }))).rejects.toThrow();
  });
});

describe.skipIf(!process.env.RUN_NETWORK_TESTS)("safeFetch (real network)", () => {
  it("fetches a normal public site", async () => {
    const result = await safeFetch("https://example.com/", { kind: "html" });
    expect(result.status).toBe(200);
    expect(result.body.toLowerCase()).toContain("<html");
  }, 15_000);

  it("follows a real http -> https redirect chain with compression", async () => {
    const result = await safeFetch("http://wikipedia.org/", { kind: "html" });
    expect(result.url.startsWith("https://")).toBe(true);
    expect(result.redirects.length).toBeGreaterThan(0);
    expect(result.body.toLowerCase()).toContain("<html");
  }, 15_000);

  it("fetches a real robots.txt", async () => {
    const result = await safeFetch("https://www.wikipedia.org/robots.txt", { kind: "robots" });
    expect(result.status).toBe(200);
    expect(result.body.toLowerCase()).toContain("user-agent");
  }, 15_000);
});
