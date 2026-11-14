import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { peekMagicLinkEmail } from "@/lib/auth/magic-link-confirm";
import { safeReturnTo } from "@/lib/auth/safe-redirect";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Confirm sign-in · ${siteConfig.name}`,
  robots: { index: false },
};

// The emailed magic link lands here. Opening this page doesn't use the link up;
// only pressing the button does. That keeps email link scanners from spending
// it, and shows which account a link would sign into before it does.
export default function ConfirmSignInPage({ searchParams }: PageProps<"/sign-in/confirm">) {
  return (
    <main className="flex flex-1 items-center justify-center px-3 py-12 sm:px-4">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-4 shadow-sm sm:p-8">
        <Link href="/" className="text-sm font-semibold text-muted hover:text-foreground">
          ← {siteConfig.name}
        </Link>
        <Suspense fallback={<div aria-hidden className="mt-6 h-40 animate-pulse rounded-2xl bg-background" />}>
          <Confirm searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Confirm({ searchParams }: Pick<PageProps<"/sign-in/confirm">, "searchParams">) {
  const params = await searchParams;
  const token = first(params.token) ?? "";
  const callbackURL = safeReturnTo(first(params.callbackURL));
  const email = await peekMagicLinkEmail(token);

  if (!email) {
    return (
      <div className="mt-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Link expired</h1>
        <p className="mt-2 text-sm text-muted">
          That sign-in link has expired or was already used. Request a new one.
        </p>
        <Link
          href="/sign-in"
          className="mt-8 block rounded-full bg-accent px-5 py-3 text-center font-semibold text-accent-ink hover:brightness-110"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Confirm sign-in</h1>
      <p className="mt-2 text-sm text-muted">
        Sign in as <span className="font-semibold text-foreground">{email}</span>?
      </p>
      <form action="/api/auth/magic-link/verify" method="get" className="mt-8">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="callbackURL" value={callbackURL} />
        <input type="hidden" name="errorCallbackURL" value="/sign-in" />
        <button
          type="submit"
          className="w-full rounded-full bg-accent px-5 py-3 font-semibold text-accent-ink hover:brightness-110"
        >
          Sign in
        </button>
      </form>
      <p className="mt-4 text-xs text-muted">
        Didn&apos;t ask to sign in, or that isn&apos;t your email? Close this page.
      </p>
    </div>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
