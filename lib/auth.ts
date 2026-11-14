import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { captcha, magicLink } from "better-auth/plugins";
import { toConfirmUrl } from "@/lib/auth/confirm-url";
import { isDisposableEmail } from "@/lib/auth/disposable";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendMagicLinkEmail } from "@/lib/email";

// Production sets BETTER_AUTH_URL. Preview deployments have changing URLs,
// so they fall back to the deployment's own host.
const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {};

export const auth = betterAuth({
  baseURL,
  trustedOrigins: baseURL ? [baseURL] : [],
  database: drizzleAdapter(db, { provider: "pg", schema }),
  socialProviders: google,
  account: {
    // Same email via Google or a magic link is the same person. Google sign-in
    // links to an existing account only when Google reports the email as
    // verified (Better Auth's default). Don't add Google to trustedProviders:
    // that would link unverified addresses too, which allows account takeover.
    accountLinking: { enabled: true },
  },
  advanced: {
    // Explicit, so tests (NODE_ENV=test) run Better Auth's origin and
    // callback-URL checks exactly as production does.
    disableOriginCheck: false,
    ipAddress: { ipAddressHeaders: [process.env.AUTH_IP_HEADER || "x-forwarded-for"] },
  },
  rateLimit: {
    enabled: process.env.NODE_ENV !== "development",
    storage: "database",
    window: 10,
    max: 100,
    customRules: {
      "/sign-in/magic-link": { window: 600, max: 5 },
    },
  },
  onAPIError: { errorURL: "/sign-in" },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/magic-link") return;
      const email = typeof ctx.body?.email === "string" ? ctx.body.email.trim().toLowerCase() : ctx.body?.email;
      if (typeof email === "string" && isDisposableEmail(email)) {
        throw new APIError("BAD_REQUEST", {
          code: "DISPOSABLE_EMAIL",
          message: "Disposable email addresses aren't allowed.",
        });
      }
      return { context: { body: { ...ctx.body, email } } };
    }),
  },
  plugins: [
    magicLink({
      expiresIn: 15 * 60,
      storeToken: "hashed",
      // The email links to our confirm page, never straight to verify.
      sendMagicLink: ({ email, url }) => sendMagicLinkEmail({ email, url: toConfirmUrl(url) }),
    }),
    // Turnstile guards only the email form; Google sign-in needs no extra check.
    captcha({
      provider: "cloudflare-turnstile",
      secretKey: process.env.TURNSTILE_SECRET_KEY ?? "",
      endpoints: ["/sign-in/magic-link"],
    }),
    nextCookies(), // must stay last
  ],
});
