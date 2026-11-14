const FALLBACK = "/dashboard";

// Only same-site paths may be used as a post-sign-in destination, so the
// sign-in flow can't be turned into an open redirect.
export function safeReturnTo(value: string | null | undefined): string {
  if (!value) return FALLBACK;
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return FALLBACK;
  }
  return isSafePath(value) && isSafePath(decoded) ? value : FALLBACK;
}

function isSafePath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return false;
  if (/^\/sign-in(?:[/?#]|$)/.test(path)) return false;
  // Catches anything a browser would still resolve to another origin
  // (for example, tabs or newlines that browsers strip).
  return new URL(path, "http://same.invalid").origin === "http://same.invalid";
}
