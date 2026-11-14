const FALLBACK = "/dashboard";
const BASE = "http://same.invalid";

// Pages a sign-in must never "return" to: the sign-in screens themselves, and
// API routes (a return-to like /api/auth/magic-link/verify?token=… would let
// someone chain the sign-in flow into another account's token).
const BLOCKED = /^\/(?:api|sign-in)(?:\/|$)/i;

// Only same-site page paths may be used as a post-sign-in destination, so the
// sign-in flow can't be turned into an open redirect. The checks run on the
// path as a browser would resolve it (dot segments, backslashes and
// percent-encoding included), and the resolved path is what's returned.
export function safeReturnTo(value: string | null | undefined): string {
  if (!value) return FALLBACK;
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return FALLBACK;
  }
  for (const candidate of [value, decoded]) {
    if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.startsWith("/\\")) {
      return FALLBACK;
    }
  }
  const resolved = new URL(value, BASE);
  const resolvedDecoded = new URL(decoded, BASE);
  if (resolved.origin !== BASE || resolvedDecoded.origin !== BASE) return FALLBACK;
  if (BLOCKED.test(resolved.pathname) || BLOCKED.test(resolvedDecoded.pathname)) return FALLBACK;
  const result = `${resolved.pathname}${resolved.search}${resolved.hash}`;
  // Resolving can itself create a protocol-relative URL (/x/..//evil.com
  // becomes //evil.com), so the string we hand back gets the same checks.
  return isSameSitePath(result) ? result : FALLBACK;
}

function isSameSitePath(path: string): boolean {
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return false;
  }
  return [path, decoded].every(
    (p) =>
      p.startsWith("/") &&
      !p.startsWith("//") &&
      !p.startsWith("/\\") &&
      new URL(p, BASE).origin === BASE,
  );
}
