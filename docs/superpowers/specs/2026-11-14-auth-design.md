# Auth: Design

Date: 2026-11-14 · Parent spec: [v1 design spec](2026-11-14-ai-resume-builder-v1-design.md) (sections 4, 5, 11.8)

Labels: **Decided** = the owner chose it. **Call** = the builder's choice; change it if wrong.

## 1. Intent

The first part of v1 "Accounts": people can sign up and sign in, and their identity is stored in our own Neon database, so every later feature (resumes, limits, billing) can hang off a user ID. The v1 spec makes "someone can see or edit another person's resume" an anti-goal, so auth has to be correct, with nothing faked.

## 2. Goals, non-goals, anti-goals

**Goals**
- Sign in with **Google** or an **email magic link**. The first sign-in creates the account, so there is no separate sign-up form. *(Decided, v1 spec §4)*
- Users, sessions and accounts are stored in Neon Postgres (Frankfurt) through **Drizzle ORM**, in tables we own. *(Decided)*
- An empty, protected `/dashboard` that shows who is signed in and has a sign-out button. Signed-out visitors who open it are sent to `/sign-in` and come back after signing in.
- The abuse protections from v1 spec §11.8: **Cloudflare Turnstile** on the magic-link form, **blocking disposable email domains**, and a **per-IP rate limit** on sign-in requests. Google sign-in skips Turnstile.
- A reusable server helper (for example `requireUser()`) that later features use to get the signed-in user or redirect. This is the base of the "every action checks ownership" rule.

**Non-goals (this piece)**
- Resumes, the real dashboard content, billing, plans and usage tables. Only the tables auth needs, and the Drizzle setup, are built now.
- Account settings and **account deletion**. Deletion has to cancel Paddle first, so it ships with billing.
- Email + password, other OAuth providers, MFA, passkeys.
- The final visual design. The v1 spec leaves the look undecided (§12), so the auth pages are plain and tidy and match the current landing page's fonts and colors; they will be restyled later.
- Replacing the demo "Afterglow" landing page. Only its "Create your account" and "Log in" links are wired to `/sign-in`.

**Anti-goals**
- A user can reach another user's session or data.
- Secrets (the Better Auth secret, Google client secret, Resend key, Turnstile secret, database URL) reach the browser bundle or the git repo.
- A magic link works more than once, or after it expires.
- Sign-in silently "works" in production with email that never sends (for example, a missing Resend key logs the link instead of failing).

## 3. Constraints

- **Next.js 16.4.6 has breaking changes** (AGENTS.md). Route protection, route handlers and server actions follow `node_modules/next/dist/docs/`, not older Next.js habits (for example, `middleware.ts` may be named differently).
- **Hosting is currently Vercel** (project `ai-resume-builder`). The v1 spec names Cloudways Velocity; nothing in this design depends on which one, so it must not use Vercel-only APIs.
- **The Neon project is in a Vercel-managed org.** Env vars come from the Vercel integration (`DATABASE_URL` pooled, `DATABASE_URL_UNPOOLED` direct). Migrations use the unpooled URL.
- **No product domain yet**, so Resend can only send test emails to the owner's own address.
- The product name is not chosen. Auth pages read it from **one config value** (v1 spec §4).

## 4. Approaches

| Approach | Trade-off | Outcome |
|---|---|---|
| **Better Auth running inside the Next.js app, with the Drizzle adapter on Neon** | Full plugin and hook control, so Turnstile, the disposable-domain block and the rate limit all fit; starts the Drizzle setup v1 needs. Costs: Google OAuth credentials are needed up front; magic-link email needs Resend plus a domain for real users. | **Chosen by the owner.** |
| Neon Auth (managed Better Auth, already enabled by the Vercel integration) | Works today with shared Google dev credentials and built-in email codes. But it has a fixed plugin set and no server hooks, so Turnstile and the disposable-domain block are hard or impossible; users live in Neon's `neon_auth` schema outside Drizzle; there is no supported migration off it later. | Rejected. |
| Clerk | Polished ready-made screens. | Already rejected in the v1 spec: user data in the US, and costs grow with users. |

## 5. How it works

**Stack** *(Calls unless marked)*
- `better-auth` (current stable) with its **Drizzle adapter** and the **magic link**, **captcha (Turnstile)** plugins and **database-backed rate limiting**. Rate-limit state is stored in Postgres, not memory, because serverless instances don't share memory.
- `drizzle-orm` with the **Neon serverless driver**; `drizzle-kit` **generates SQL migrations that are committed** and applied with `drizzle-kit migrate` (not `push`), so production changes are reviewable.
- Better Auth's own tables (user, session, account, verification, plus rate-limit) are generated into the Drizzle schema, so they share one migration history with later tables.

**Sessions** *(Call)*: Better Auth's default database sessions in an httpOnly, secure, SameSite=Lax cookie, with a short cookie cache to avoid a DB read on every request. Session length: Better Auth's default (7 days, refreshed while active).

**Route protection** *(Call)*: a fast cookie check at the edge of the request (Next 16's proxy/middleware equivalent) redirects signed-out users away from `/dashboard` and other app routes. The **real check is on the server** in each page, action and route via `requireUser()`, which reads the session from the database. The proxy check alone is never trusted.

**Pages**
- `/sign-in`: "Continue with Google" button; an email field + Turnstile widget + "Email me a sign-in link" button; a "Check your email" state after sending; clear errors for a disposable domain, captcha failure, rate limit and an expired or used link.
- `/dashboard`: protected; "Signed in as …" and a sign-out button. Placeholder for the resume list.
- The landing page's "Create your account" and "Log in" links point to `/sign-in`. A signed-in visitor going to `/sign-in` is sent to `/dashboard`.
- `callbackURL` / return-to only accepts **same-site relative paths**, so the sign-in flow can't be used as an open redirect.

**Magic-link email** *(Call)*
- Links expire after **15 minutes** and work **once** (Better Auth's behavior; verified by a test).
- **Development:** if `RESEND_API_KEY` is not set, the link is printed to the server console.
- **Production:** sending uses Resend. If the key or sender address is missing, sign-in returns an error and logs it — it never falls back to the console.
- Until a domain exists, production magic links are effectively owner-only; Google sign-in is the path for everyone else.

**Abuse protection** *(Calls, from v1 spec §11.8)*
- **Turnstile** is checked on the server for the magic-link request only. Development uses Cloudflare's published always-pass test keys.
- **Disposable domains** are rejected before any email is sent, using a maintained npm list of disposable domains, checked in a Better Auth hook so it covers every path that creates a user by email.
- **Rate limits:** Better Auth's built-in limits, tightened on the magic-link endpoint (for example 5 requests per IP per 10 minutes) and stored in Postgres.

**Environment variables** (server-only, never `NEXT_PUBLIC_` except the Turnstile site key)
`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Set in Vercel for production and preview, pulled into `.env.local` for development.

**Neon Auth cleanup:** the Neon Auth instance the integration enabled is turned off, after the owner confirms, so there is one source of users. Its env vars are removed from the Vercel project.

**Database branches** *(Call, v1 spec §6)*: local development uses a Neon `dev` branch, not the production branch, if the Vercel-managed org allows creating branches; otherwise the builder reports it and uses the main branch until it's sorted out.

## 5a. Details settled after review (all Calls)

1. **Same email, two sign-in methods = one user.** Google and magic link link automatically to the same account when the email matches: clicking a magic link proves the person owns the mailbox, and Google sign-in links only when Google reports the email as verified. Google is **not** in Better Auth's `trustedProviders`, because trusting it would also link addresses Google hasn't verified, which allows account takeover (found by security review during the build). Both orders (Google first, then link; link first, then Google) are checked by hand in a browser, because automating real Google sign-in would mean faking Google. A unit test pins the linking config.
2. **Table names and IDs.** Keep Better Auth's default table names (`user`, `session`, `account`, `verification`, plus `rateLimit`) and its text IDs. Later v1 tables reference `user.id` as text. Later, `ai_call_log.userId` will be nullable with `on delete set null` (parent spec §11.9); every other user-owned table cascades on delete.
3. **Where Google sign-in works:** localhost (`http://localhost:3000`) and production (`https://ai-resume-builder-navy-seven.vercel.app` until a custom domain exists). It doesn't work on preview deployments, because their URLs change and Google doesn't allow wildcard redirect URIs. Previews use Turnstile test keys and the magic link only. `BETTER_AUTH_URL` and the trusted origins come from env per environment; previews read their URL from the deployment's own env.
4. **What tests run against.** Automated tests that touch the database run against a **throwaway Neon branch** created for the run (or the `dev` branch), never the production branch. If Neon branches can't be created in the Vercel-managed org, the builder **stops and asks** rather than testing against production. Vitest gets added, since the repo has no test setup yet.
5. **Client IP for rate limits:** read from a header set by an env var. The default is `x-forwarded-for`, which Vercel overwrites, so clients can't spoof it. On Cloudways/Cloudflare, set it to `cf-connecting-ip`.
6. **The disposable-domain check is for the email path only.** Google sign-in skips it, matching parent spec §11.8 ("Google sign-in needs no extra check").
7. **Magic links can be opened on another device** (the common case: request on a laptop, open on a phone). Each link still works once and expires after 15 minutes.
8. **Error messages can be specific** (disposable domain, rate limit, captcha failed). There's no sign-up/sign-in split, so they reveal nothing about whether an account exists.
9. **The fast proxy check covers `/dashboard`, `/resumes/*` and `/settings/*` now,** so routes added later are already covered. `requireUser()` on the server is still the real check.

## 6. Done means

- **Manual, in a real browser:** Google sign-in creates a user and lands on `/dashboard`; magic link (console in dev) does the same; sign-out works; reload keeps the session; `/dashboard` signed-out redirects to `/sign-in` and returns after sign-in.
- **Automated tests** for: open-redirect rejection; disposable domain rejected; magic link single-use and expiry; `requireUser()` redirects with no session; rate limit trips after the threshold; Turnstile failure rejects the request.
- `npm run build`, lint and type check pass. No secret appears in the client bundle.
- A production deploy on Vercel with Google sign-in working end to end.

## 7. Needed from the owner

1. **A Google OAuth client** (Google Cloud Console → Credentials → OAuth client ID, "Web application"), with redirect URIs for `http://localhost:3000` and the Vercel production URL, ending in `/api/auth/callback/google`. The builder gives exact URLs and steps.
2. **Cloudflare Turnstile keys** for production (dev uses test keys).
3. **Resend** account and API key; the sending domain waits for the product domain.
4. Confirmation before turning Neon Auth off.

## 8. Left to the builder

File layout, exact package versions, the rate-limit numbers, the disposable-domain package, the test framework for the automated tests (Vitest is the default unless something in the repo says otherwise), and the exact wording and styling of the auth pages within the current landing page's look.
