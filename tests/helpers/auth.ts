import { vi } from "vitest";
import { auth } from "@/lib/auth";
import { sendMagicLinkEmail } from "@/lib/email";

// Test files that use these helpers must call `vi.mock("@/lib/email")` so the
// magic link is captured instead of sent.

const ORIGIN = "http://localhost:3000";

export function uniqueEmail(): string {
  return `t-${crypto.randomUUID()}@example.com`;
}

export function randomIp(): string {
  const n = () => Math.floor(Math.random() * 254) + 1;
  return `10.${n()}.${n()}.${n()}`;
}

export async function requestMagicLink(
  email: string,
  opts: {
    ip?: string;
    captcha?: string | null;
    callbackURL?: string;
    errorCallbackURL?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<Response> {
  const headers = new Headers({
    "content-type": "application/json",
    origin: ORIGIN,
    "x-forwarded-for": opts.ip ?? randomIp(),
    ...opts.headers,
  });
  // Cloudflare's dummy token; the test env uses the always-pass secret.
  const captcha = opts.captcha === undefined ? "XXXX.DUMMY.TOKEN.XXXX" : opts.captcha;
  if (captcha !== null) headers.set("x-captcha-response", captcha);
  return auth.handler(
    new Request(`${ORIGIN}/api/auth/sign-in/magic-link`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        callbackURL: opts.callbackURL ?? "/dashboard",
        errorCallbackURL: opts.errorCallbackURL ?? "/sign-in",
      }),
    }),
  );
}

export function lastMagicLinkUrl(): string {
  const call = vi.mocked(sendMagicLinkEmail).mock.lastCall;
  if (!call) throw new Error("No magic link was sent");
  return call[0].url;
}

// Accepts the emailed link. When it's the confirm page, this does what its
// "Sign in" button does: a GET to the verify endpoint with the same token.
export async function verify(url: string): Promise<Response> {
  const link = new URL(url);
  if (link.pathname === "/sign-in/confirm") {
    const target = new URL("/api/auth/magic-link/verify", link.origin);
    target.searchParams.set("token", link.searchParams.get("token") ?? "");
    target.searchParams.set("callbackURL", link.searchParams.get("callbackURL") ?? "/dashboard");
    target.searchParams.set("errorCallbackURL", "/sign-in");
    url = target.toString();
  }
  return auth.handler(new Request(url, { headers: { "x-forwarded-for": randomIp() } }));
}

export function sessionCookieFrom(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

export async function signInViaLink(email: string) {
  const sent = await requestMagicLink(email);
  if (sent.status !== 200) throw new Error(`magic link request failed: ${sent.status}`);
  const res = await verify(lastMagicLinkUrl());
  const cookie = sessionCookieFrom(res);
  const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
  if (!session) throw new Error("no session after verifying the magic link");
  return { ...session, cookie };
}
