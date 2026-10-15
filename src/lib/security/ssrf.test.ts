import { describe, expect, it, vi } from "vitest";
import { normalizeUrl } from "@/lib/schemas";
import { FetchError } from "./errors";
import { checkUrlShape, isBlockedAddress, validateUrl, type LookupFn } from "./ssrf";

const publicLookup: LookupFn = async () => [{ address: "93.184.215.14", family: 4 }];

function shapeOf(input: string) {
  const url = normalizeUrl(input);
  if (!url) throw new Error(`unparseable test input: ${input}`);
  return checkUrlShape(url);
}

async function codeOf(promise: Promise<unknown>) {
  try {
    await promise;
    return "OK";
  } catch (error) {
    if (error instanceof FetchError) return error.code;
    throw error;
  }
}

describe("isBlockedAddress", () => {
  it.each([
    "127.0.0.1",
    "127.255.255.254",
    "10.0.0.1",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "0.0.0.0",
    "100.64.0.1",
    "224.0.0.1",
    "255.255.255.255",
    "::",
    "::1",
    "fc00::1",
    "fd12:3456::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "::ffff:10.0.0.1",
    "::ffff:a9fe:a9fe",
    "64:ff9b::a00:1",
    "2002:7f00:1::",
    "ff02::1",
    "not-an-ip",
    "",
  ])("blocks %s", (address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it.each(["93.184.215.14", "8.8.8.8", "1.1.1.1", "172.32.0.1", "2606:4700:4700::1111", "2001:4860:4860::8888"])(
    "allows public %s",
    (address) => {
      expect(isBlockedAddress(address)).toBe(false);
    },
  );
});

describe("checkUrlShape", () => {
  it.each([
    ["file:///etc/passwd", "INVALID_URL"],
    ["ftp://example.com/", "INVALID_URL"],
    ["javascript:alert(1)", "INVALID_URL"],
    ["https://user:pass@example.com/", "INVALID_URL"],
    ["https://user@example.com/", "INVALID_URL"],
    ["https://example.com:8080/", "BLOCKED"],
    ["http://example.com:443/", "BLOCKED"],
    ["localhost", "BLOCKED"],
    ["http://localhost/", "BLOCKED"],
    ["http://app.localhost/", "BLOCKED"],
    ["http://intranet/", "BLOCKED"],
    ["http://127.0.0.1/", "BLOCKED"],
    ["http://10.1.2.3/", "BLOCKED"],
    ["http://169.254.169.254/latest/meta-data/", "BLOCKED"],
    ["http://[::1]/", "BLOCKED"],
    ["http://[::ffff:127.0.0.1]/", "BLOCKED"],
    ["http://2130706433/", "BLOCKED"], // decimal 127.0.0.1
    ["http://0x7f.1/", "BLOCKED"], // hex 127.0.0.1
    ["http://017700000001/", "BLOCKED"], // octal 127.0.0.1
    ["http://0/", "BLOCKED"],
  ])("rejects %s with %s", (input, expected) => {
    expect(shapeOf(input)).toBe(expected);
  });

  it.each(["example.com", "https://www.example.com/page?x=1", "http://93.184.215.14/", "https://example.com:443/"])(
    "accepts %s",
    (input) => {
      expect(shapeOf(input)).toBeNull();
    },
  );
});

describe("validateUrl", () => {
  it("returns every resolved address when all are public", async () => {
    const lookup: LookupFn = async () => [
      { address: "93.184.215.14", family: 4 },
      { address: "2606:2800:21f:cb07:6820:80da:af6b:8b2c", family: 6 },
    ];
    await expect(validateUrl(new URL("https://example.com/"), lookup)).resolves.toHaveLength(2);
  });

  it("rejects when any one resolved address is private", async () => {
    const lookup: LookupFn = async () => [
      { address: "93.184.215.14", family: 4 },
      { address: "10.0.0.5", family: 4 },
    ];
    expect(await codeOf(validateUrl(new URL("https://example.com/"), lookup))).toBe("BLOCKED");
  });

  it("rejects a public-looking hostname that resolves to the metadata address", async () => {
    const lookup: LookupFn = async () => [{ address: "169.254.169.254", family: 4 }];
    expect(await codeOf(validateUrl(new URL("https://evil.example/"), lookup))).toBe("BLOCKED");
  });

  it("rejects a hostname that resolves to IPv6 loopback", async () => {
    const lookup: LookupFn = async () => [{ address: "::1", family: 6 }];
    expect(await codeOf(validateUrl(new URL("https://evil.example/"), lookup))).toBe("BLOCKED");
  });

  it("reports unknown hosts as unreachable", async () => {
    const lookup: LookupFn = async () => {
      throw Object.assign(new Error("getaddrinfo ENOTFOUND"), { code: "ENOTFOUND" });
    };
    expect(await codeOf(validateUrl(new URL("https://nope.example/"), lookup))).toBe("UNREACHABLE");
  });

  it("reports an empty DNS answer as unreachable", async () => {
    expect(await codeOf(validateUrl(new URL("https://empty.example/"), async () => []))).toBe("UNREACHABLE");
  });

  it("skips DNS for public IP literals", async () => {
    const lookup = vi.fn(publicLookup);
    await expect(validateUrl(new URL("http://93.184.215.14/"), lookup)).resolves.toEqual([
      { address: "93.184.215.14", family: 4 },
    ]);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("rejects bad shapes before any DNS lookup", async () => {
    const lookup = vi.fn(publicLookup);
    expect(await codeOf(validateUrl(new URL("https://user:pass@example.com/"), lookup))).toBe("INVALID_URL");
    expect(lookup).not.toHaveBeenCalled();
  });
});
