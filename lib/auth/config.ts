type Env = Record<string, string | undefined>;

// Production sets BETTER_AUTH_URL. Previews have no fixed URL, so they use the
// deployment's own host and also trust the branch alias
// (…-git-<branch>-….vercel.app), which people open more often.
export function resolveAuthUrls(env: Env): { baseURL: string | undefined; trustedOrigins: string[] } {
  if (env.BETTER_AUTH_URL) {
    return { baseURL: env.BETTER_AUTH_URL, trustedOrigins: [env.BETTER_AUTH_URL] };
  }
  const hosts = [env.VERCEL_URL, env.VERCEL_BRANCH_URL].filter((h): h is string => Boolean(h));
  const origins = hosts.map((h) => `https://${h}`);
  return { baseURL: origins[0], trustedOrigins: origins };
}

const REQUIRED_IN_PRODUCTION = [
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "TURNSTILE_SECRET_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
] as const;

// Fails the production deployment loudly instead of letting sign-in break for
// users at runtime. Only checks Vercel production, so local builds and
// previews (which can run without some of these) are unaffected.
export function assertProductionEnv(env: Env): void {
  if (env.VERCEL_ENV !== "production") return;
  const missing = REQUIRED_IN_PRODUCTION.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing production environment variables: ${missing.join(", ")}`);
  }
}
