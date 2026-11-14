import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { siteConfig } from "@/lib/site-config";
import { SessionKeepAlive } from "./session-keep-alive";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  title: `Dashboard · ${siteConfig.name}`,
  robots: { index: false },
};

// Everything signed-in sits behind one boundary that awaits requireUser(), so
// a visitor with a stale or forged cookie sees only the placeholder before the
// redirect, never the page itself.
export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={<DashboardPlaceholder />}>
        <Dashboard />
      </Suspense>
    </div>
  );
}

async function Dashboard() {
  const user = await requireUser("/dashboard");
  return (
    <>
      <SessionKeepAlive />
      <Header>
        <div className="flex min-w-0 items-center gap-3 text-sm">
          <span className="truncate text-muted">
            Signed in as <span className="font-semibold text-foreground">{user.email}</span>
          </span>
          <SignOutButton />
        </div>
      </Header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Your resumes</h1>
        <p className="mt-6 rounded-3xl border border-dashed border-line px-6 py-12 text-center text-muted">
          Your resumes will appear here.
        </p>
      </main>
    </>
  );
}

function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Link href="/" className="font-bold tracking-tight">
          {siteConfig.name}
        </Link>
        {children}
      </div>
    </header>
  );
}

function DashboardPlaceholder() {
  return (
    <>
      <Header />
      <main aria-hidden className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-8">
        <div className="h-9 w-48 animate-pulse rounded-xl bg-surface" />
        <div className="mt-6 h-36 animate-pulse rounded-3xl bg-surface" />
      </main>
    </>
  );
}
