import { lookup as dnsLookup } from "node:dns/promises";
import { request as httpRequest, type IncomingMessage } from "node:http";
import { request as httpsRequest } from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";
import { formatSize } from "@earendil-works/pi-coding-agent";

export const FETCH_MAX_BYTES = 1_000_000;

const encoder = new TextEncoder();
const blockedIPv4Addresses = new BlockList();
const blockedIPv6Addresses = new BlockList();

for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.31.196.0", 24],
  ["192.52.193.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["192.175.48.0", 24],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blockedIPv4Addresses.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["::ffff:0:0", 96],
  ["64:ff9b::", 96],
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["2001:2::", 48],
  ["2001:db8::", 32],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  blockedIPv6Addresses.addSubnet(network, prefix, "ipv6");
}

export interface ValidatedTarget {
  url: URL;
  address: string;
  family: 4 | 6;
}

type ResolveAddresses = (hostname: string) => Promise<string[]>;

async function resolveAddresses(hostname: string): Promise<string[]> {
  return (await dnsLookup(hostname, { all: true, verbatim: true })).map((record) => record.address);
}

export function isPrivateAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return blockedIPv4Addresses.check(address, "ipv4");
  if (family === 6) return blockedIPv6Addresses.check(address, "ipv6");
  return true;
}

export async function validateRemoteUrl(
  value: string | URL,
  resolveHostname: ResolveAddresses = resolveAddresses,
): Promise<ValidatedTarget> {
  const url = value instanceof URL ? value : new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new Error("web_fetch only supports HTTP and HTTPS URLs.");
  if (url.username || url.password)
    throw new Error("web_fetch blocks URLs containing credentials.");

  const hostname = url.hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("web_fetch blocks local hostnames.");
  }

  const addresses = isIP(hostname) ? [hostname] : await resolveHostname(hostname);
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new Error(`web_fetch blocks private or reserved network targets (${hostname}).`);
  }
  const address = addresses[0];
  const family = isIP(address);
  if (family !== 4 && family !== 6) throw new Error(`web_fetch could not resolve ${hostname}.`);
  return { url, address, family };
}

export async function requestPinned(
  target: ValidatedTarget,
  signal: AbortSignal,
): Promise<IncomingMessage> {
  const lookup: LookupFunction = (_hostname, options, callback) => {
    if (options.all) callback(null, [{ address: target.address, family: target.family }]);
    else callback(null, target.address, target.family);
  };
  const request = target.url.protocol === "https:" ? httpsRequest : httpRequest;
  return await new Promise((resolve, reject) => {
    const outgoing = request(
      target.url,
      {
        lookup,
        signal,
        headers: {
          Accept: "text/markdown, text/html, text/plain, application/json;q=0.9, */*;q=0.1",
          "User-Agent": "Mozilla/5.0 (compatible; PiWebFetch/1.0; +https://pi.dev)",
        },
      },
      resolve,
    );
    outgoing.once("error", reject);
    outgoing.end();
  });
}

export function responseHeader(response: IncomingMessage, name: string): string | undefined {
  const value = response.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

export async function readResponseBytes(
  response: IncomingMessage,
  maxBytes: number,
): Promise<Uint8Array> {
  const declared = Number(responseHeader(response, "content-length"));
  if (Number.isFinite(declared) && declared > maxBytes)
    throw new Error(`web_fetch response exceeds ${formatSize(maxBytes)}.`);
  const chunks: Uint8Array[] = [];
  let total = 0;
  for await (const value of response) {
    const chunk = typeof value === "string" ? encoder.encode(value) : new Uint8Array(value);
    total += chunk.byteLength;
    if (total > maxBytes) {
      response.destroy();
      throw new Error(`web_fetch response exceeds ${formatSize(maxBytes)}.`);
    }
    chunks.push(chunk);
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

export function decodeResponse(bytes: Uint8Array, contentTypeHeader: string): string {
  const charset = contentTypeHeader.match(/(?:^|;)\s*charset\s*=\s*["']?([^;"'\s]+)/i)?.[1];
  try {
    return new TextDecoder(charset || "utf-8").decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}
