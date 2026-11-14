"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteResumeAction, duplicateResumeAction, renameResumeAction } from "@/app/resumes/actions";

export type ResumeRow = { id: string; title: string; jobTitle: string; jobCompany: string; updatedAt: string };

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

function edited(iso: string): string {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return `Edited ${rtf.format(Math.round(seconds / size), unit)}`;
  }
  return "Edited just now";
}

function Row({ resume }: { resume: ResumeRow }) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(resume.title);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (action: () => Promise<{ ok: boolean }>, failure: string) =>
    startTransition(async () => {
      setError(null);
      const { ok } = await action();
      if (!ok) setError(failure);
    });

  const madeFor = [resume.jobCompany, resume.jobTitle].filter(Boolean).join(" – ");
  const button = "rounded-full px-3 py-1.5 text-xs font-semibold text-muted hover:bg-background disabled:opacity-40";

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="min-w-0 flex-1">
        {renaming ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setRenaming(false);
              run(() => renameResumeAction(resume.id, title), "Couldn't rename. Try again.");
            }}
          >
            <input
              aria-label="New title"
              autoFocus
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setRenaming(false)}
              onKeyDown={(e) => e.key === "Escape" && (setTitle(resume.title), setRenaming(false))}
              className="w-full rounded-xl border border-line bg-surface px-3 py-1.5 font-semibold outline-none focus:border-accent"
            />
          </form>
        ) : (
          <Link href={`/resumes/${resume.id}`} className="block truncate font-semibold hover:underline">
            {resume.title}
          </Link>
        )}
        <p className="mt-0.5 truncate text-xs text-muted">
          {madeFor && <>Made for {madeFor} · </>}
          <time dateTime={resume.updatedAt} suppressHydrationWarning>
            {edited(resume.updatedAt)}
          </time>
        </p>
        {error && (
          <p role="alert" className="mt-1 text-xs text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        <button type="button" className={button} disabled={pending} onClick={() => setRenaming(true)}>
          Rename
        </button>
        <button
          type="button"
          className={button}
          disabled={pending}
          onClick={() => run(() => duplicateResumeAction(resume.id), "Couldn't duplicate. Try again.")}
        >
          Duplicate
        </button>
        <button
          type="button"
          className={`${button} text-red-700 dark:text-red-300`}
          disabled={pending}
          onClick={() => {
            if (window.confirm(`Delete “${resume.title}”? This can't be undone.`)) {
              run(() => deleteResumeAction(resume.id), "Couldn't delete. Try again.");
            }
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export function ResumeList({ resumes }: { resumes: ResumeRow[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {resumes.map((r) => (
        <Row key={r.id} resume={r} />
      ))}
    </ul>
  );
}
