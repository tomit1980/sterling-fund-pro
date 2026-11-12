/**
 * Client IP resolution that cannot be spoofed by the client.
 *
 * `X-Forwarded-For` is only trustworthy for the entries appended by proxies we control. With
 * TRUSTED_PROXY_HOPS = n, the n right-most entries were appended by trusted proxies and the client IP
 * is the n-th entry from the right. Default: 1 hop (one reverse proxy / platform edge in front of the app).
 * Set TRUSTED_PROXY_HOPS=0 when the app is exposed directly (then the header is ignored entirely).
 */
export function resolveClientIp(getHeader: (name: string) => string | null): string {
  const hopsRaw = process.env.TRUSTED_PROXY_HOPS;
  const hops = hopsRaw === undefined || hopsRaw === "" ? 1 : Math.max(0, Number.parseInt(hopsRaw, 10) || 0);
  if (hops > 0) {
    const fwd = getHeader("x-forwarded-for");
    if (fwd) {
      const parts = fwd
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const idx = parts.length - hops;
      if (idx >= 0 && parts[idx]) return parts[idx].slice(0, 64);
    }
    // Platform-specific single-value headers are set by the edge and cannot be injected by clients.
    const real = getHeader("x-real-ip");
    if (real) return real.trim().slice(0, 64);
  }
  return "unknown";
}
