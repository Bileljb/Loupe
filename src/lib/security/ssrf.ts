import { lookup as dnsLookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { FetchError, type FetchErrorCode } from "./errors";

export type ResolvedAddress = { address: string; family: 4 | 6 };
export type LookupFn = (hostname: string) => Promise<{ address: string; family: number }[]>;

export const systemLookup: LookupFn = (hostname) =>
  dnsLookup(hostname, { all: true, verbatim: true });

// Private, loopback, link-local, shared, documentation, multicast and reserved ranges.
const blockedIpv4: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8],
  ["169.254.0.0", 16], // link-local, includes cloud metadata 169.254.169.254
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, includes broadcast
];

const blockedIpv6: [string, number][] = [
  ["::", 96], // unspecified, loopback and IPv4-compatible
  ["::ffff:0:0", 96], // IPv4-mapped: never needed to reach a public site
  ["64:ff9b::", 96], // NAT64, can embed private IPv4
  ["64:ff9b:1::", 48],
  ["100::", 64], // discard
  ["2001::", 32], // Teredo, embeds IPv4
  ["2001:db8::", 32], // documentation
  ["2002::", 16], // 6to4, embeds IPv4
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["fec0::", 10], // deprecated site-local
  ["ff00::", 8], // multicast
];

// One list per family: a shared BlockList matches IPv4 addresses against IPv6 rules as
// IPv4-mapped (::ffff:a.b.c.d), so the ::ffff:0:0/96 rule would block every IPv4 address.
const ipv4BlockList = new BlockList();
const ipv6BlockList = new BlockList();
for (const [network, prefix] of blockedIpv4) ipv4BlockList.addSubnet(network, prefix, "ipv4");
for (const [network, prefix] of blockedIpv6) ipv6BlockList.addSubnet(network, prefix, "ipv6");

/** True for anything that is not a well-formed public IP address. */
export function isBlockedAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 0) return true;
  try {
    return family === 4
      ? ipv4BlockList.check(address, "ipv4")
      : ipv6BlockList.check(address, "ipv6");
  } catch {
    return true;
  }
}

function bareHostname(url: URL): string {
  return url.hostname.replace(/^\[|\]$/g, "");
}

/** Checks that need no network: scheme, credentials, port, and obviously internal hosts. */
export function checkUrlShape(url: URL): FetchErrorCode | null {
  if (url.protocol !== "http:" && url.protocol !== "https:") return "INVALID_URL";
  if (url.username || url.password) return "INVALID_URL";
  // WHATWG URL drops default ports, so any explicit port here is non-standard.
  if (url.port !== "") return "BLOCKED";

  const host = bareHostname(url);
  if (!host) return "INVALID_URL";
  if (isIP(host)) return isBlockedAddress(host) ? "BLOCKED" : null;
  if (host === "localhost" || host.endsWith(".localhost")) return "BLOCKED";
  // Single-label names (intranet, router) only resolve inside private networks.
  if (!host.replace(/\.$/, "").includes(".")) return "BLOCKED";
  return null;
}

/**
 * Validates the URL and resolves its hostname. Rejects if ANY resolved address is blocked.
 * The returned addresses are the only ones the connection may use (IP pinning).
 */
export async function validateUrl(
  url: URL,
  lookup: LookupFn = systemLookup,
): Promise<ResolvedAddress[]> {
  const shapeError = checkUrlShape(url);
  if (shapeError) throw new FetchError(shapeError);

  const host = bareHostname(url);
  const literalFamily = isIP(host);
  if (literalFamily === 4 || literalFamily === 6) return [{ address: host, family: literalFamily }];

  let results: { address: string; family: number }[];
  try {
    results = await lookup(host);
  } catch (error) {
    throw new FetchError("UNREACHABLE", { cause: error });
  }
  if (results.length === 0) throw new FetchError("UNREACHABLE");

  const addresses: ResolvedAddress[] = [];
  for (const { address } of results) {
    const family = isIP(address);
    if ((family !== 4 && family !== 6) || isBlockedAddress(address)) {
      throw new FetchError("BLOCKED");
    }
    addresses.push({ address, family });
  }
  return addresses;
}
