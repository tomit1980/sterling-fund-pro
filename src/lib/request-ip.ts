/**
 * Client IP resolution that cannot be spoofed by the client.
 *
 * `X-Forwarded-For` is only trustworthy for the entries appended by proxies we control. With
 * TRUSTED_PROXY_HOPS = n, the n right-most entries were appended by trusted proxies and the client IP
 * is the n-th entry from the right. Default: 1 hop (one reverse proxy / platform edge in front of the app).
 *
 * - If the header has fewer entries than `hops`, the chain is misconfigured: fail closed to "unknown"
 *   (shared bucket) rather than trusting a client-controlled value.
 * - `X-Real-IP` is only honoured when TRUST_X_REAL_IP=true, i.e. the operator confirms the edge overwrites it.
 * - TRUSTED_PROXY_HOPS=0 disables header parsing entirely. Next.js route handlers do not expose the socket
 *   address, so the result is the shared sentinel "unknown" — acceptable only for local development.
 *
 * Security trade-off (documented): a shared "unknown" bucket means all unattributed traffic shares one
 * rate limit. That is deliberately preferred over a bypass. Account lockout is keyed by account, not IP.
 */

function parseHops(): number {
  const raw = process.env.TRUSTED_PROXY_HOPS;
  if (raw === undefined || raw === "") return 1;
  if (!/^\d{1,2}$/.test(raw)) {
    throw new Error(`TRUSTED_PROXY_HOPS must be a non-negative integer, got "${raw}"`);
  }
  return Number.parseInt(raw, 10);
}

function isPlausibleIp(value: string): boolean {
  // IPv4, IPv6 (incl. bracketed/with zone), nothing else.
  return /^[0-9a-fA-F:.\[\]%]{3,64}$/.test(value);
}

export function resolveClientIp(getHeader: (name: string) => string | null): string {
  const hops = parseHops();
  if (hops === 0) return "unknown";

  if (process.env.TRUST_X_REAL_IP === "true") {
    const real = getHeader("x-real-ip")?.trim();
    if (real && isPlausibleIp(real)) return real;
  }

  const fwd = getHeader("x-forwarded-for");
  if (!fwd) return "unknown";
  const parts = fwd
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length < hops) return "unknown"; // fail closed on a short chain
  const candidate = parts[parts.length - hops];
  return isPlausibleIp(candidate) ? candidate : "unknown";
}
