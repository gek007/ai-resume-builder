import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createResumeAction } from "@/app/resumes/actions";
import { requireUser } from "@/lib/auth/session";
import { listResumes } from "@/lib/resume/data";
import { siteConfig } from "@/lib/site-config";
import { ResumeList } from "./resume-list";
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

function NewResumeButton() {
  return (
    <form action={createResumeAction}>
      <button
        type="submit"
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink hover:brightness-110"
      >
        New resume
      </button>
    </form>
  );
}

async function Dashboard() {
  const user = await requireUser("/dashboard");
  const resumes = await listResumes(user.id);
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Your resumes</h1>
          {resumes.length > 0 && <NewResumeButton />}
        </div>
        {resumes.length > 0 ? (
          <div className="mt-6">
            <ResumeList
              resumes={resumes.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }))}
            />
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-line px-6 py-12 text-center">
            <p className="text-muted">You don&apos;t have a resume yet.</p>
            <NewResumeButton />
          </div>
        )}
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
