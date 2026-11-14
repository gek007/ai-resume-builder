import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { safeReturnTo } from "@/lib/auth/safe-redirect";
import { getCurrentUser } from "@/lib/auth/session";
import { siteConfig } from "@/lib/site-config";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: `Sign in · ${siteConfig.name}`,
  robots: { index: false },
};

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    // Mobile padding leaves the Turnstile widget its 300px minimum at a 360px viewport.
    <main className="flex flex-1 items-center justify-center px-3 py-12 sm:px-4">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-print p-4 shadow-sm sm:p-8">
        <Link href="/" className="text-sm font-semibold text-muted hover:text-foreground">
          ← {siteConfig.name}
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted">New here? Signing in creates your account.</p>
        <Suspense fallback={<FormPlaceholder />}>
          <SignInGate searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function SignInGate({ searchParams }: Pick<PageProps<"/sign-in">, "searchParams">) {
  const params = await searchParams;
  const returnTo = safeReturnTo(first(params.returnTo));
  // A real session check, not a cookie check: a stale cookie must not bounce
  // the visitor between /sign-in and /dashboard.
  if (await getCurrentUser()) redirect(returnTo);
  return (
    <SignInForm
      returnTo={returnTo}
      error={first(params.error)}
      googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
      turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
    />
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function FormPlaceholder() {
  return <div aria-hidden className="mt-8 h-64 animate-pulse rounded-2xl bg-background" />;
}
