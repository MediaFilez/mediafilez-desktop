import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const PRIVATE_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".lan",
  ".internal",
  ".home.arpa",
];

function isIpv4Literal(host: string): boolean {
  const parts = host.split(".");
  return ( parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255));
}

function isPrivateIpv4(host: string): boolean {
  const [a, b, c] = host.split(".").map(Number);
  return ( a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || (a === 192 && b === 0 && (c === 0 || c === 2)) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113));
}

function isPrivateMappedIpv4(high: string, low: string): boolean {
  const highPart = parseInt(high, 16);
  const lowPart = parseInt(low, 16);
  const address = [(highPart >> 8) & 0xff, highPart & 0xff, (lowPart >> 8) & 0xff, lowPart & 0xff].join(".");

  return isPrivateIpv4(address);
}

function isPrivateIpv6(host: string): boolean {
  if (host === "::" || host === "::1") return true;

  const mapped = /^::ffff:(.+)$/i.exec(host);
  if (mapped) {
    const mappedHex = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(mapped[1]);

    if (isIpv4Literal(mapped[1])) return isPrivateIpv4(mapped[1]);
    if (mappedHex) return isPrivateMappedIpv4(mappedHex[1], mappedHex[2]);
  }

  const compatible = /^::(\d+\.\d+\.\d+\.\d+)$/i.exec(host);
  if (compatible) return isPrivateIpv4(compatible[1]);

  const compatibleHex = /^::([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(host);
  if (compatibleHex) return isPrivateMappedIpv4(compatibleHex[1], compatibleHex[2]);

  if (/^f[cd][0-9a-f]{2}:/i.test(host)) return true;
  if (/^fe[89ab][0-9a-f]:/i.test(host)) return true;
  if (/^fe[c-f][0-9a-f]:/i.test(host)) return true;
  if (/^ff[0-9a-f]{2}:/i.test(host)) return true;
  if (/^2001:0?db8:/i.test(host)) return true;
  return false;
}


function isBlockedHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost") return true;

  if (PRIVATE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  if (isIpv4Literal(host)) return isPrivateIpv4(host);
  if (host.includes(":")) return isPrivateIpv6(host);

  return false;
}

export function isProbablyUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    if (parsed.username || parsed.password) return false;
    if (!parsed.hostname.includes(".") && !parsed.hostname.includes(":")) return false;

    return !isBlockedHost(parsed.hostname);
  } catch { return false };
}
