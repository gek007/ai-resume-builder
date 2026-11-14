import "server-only";
import { createHash } from "node:crypto";
import { auth } from "@/lib/auth";

export { toConfirmUrl } from "@/lib/auth/confirm-url";

// Looks up which email a magic-link token was issued for, without using the
// token up. Returns null for unknown, used or expired tokens. Mirrors how
// Better Auth's magic-link plugin stores tokens with storeToken: "hashed"
// (identifier "magic-link:" + base64url(SHA-256(token))); the tests catch it if
// a Better Auth upgrade changes that.
export async function peekMagicLinkEmail(token: string): Promise<string | null> {
  if (!token) return null;
  const hashed = createHash("sha256").update(token).digest("base64url");
  const ctx = await auth.$context;
  const row = await ctx.internalAdapter.findVerificationValue(`magic-link:${hashed}`);
  // Better Auth gates expiry when consuming, not when finding, so check here.
  if (!row || new Date(row.expiresAt).getTime() <= Date.now()) return null;
  try {
    const value = JSON.parse(row.value) as { type?: unknown; email?: unknown };
    return value.type === "magic-link" && typeof value.email === "string" ? value.email : null;
  } catch {
    return null;
  }
}
