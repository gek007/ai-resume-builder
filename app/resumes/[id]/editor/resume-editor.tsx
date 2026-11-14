"use client";

import Link from "next/link";
import { useState } from "react";
import { ResumePreview } from "@/components/resume/resume-preview";
import type { AutosaveStatus } from "@/lib/resume/autosave";
import { PAPER_SIZES, type PaperSize, type ResumeContent, type SectionKey } from "@/lib/resume/schema";
import { SectionCard } from "./section-card";
import { SectionForm } from "./section-forms";
import { Field, TextArea, TextInput, inputClass } from "./ui";
import { useAutosave } from "./use-autosave";

export type EditorDoc = {
  title: string;
  content: ResumeContent;
  paperSize: PaperSize;
  jobTitle: string;
  jobCompany: string;
  jobDescription: string;
};

const TITLES: Record<SectionKey, string> = {
  contact: "Contact",
  summary: "Summary",
  experience: "Experience",
  military: "Military Service",
  projects: "Projects",
  education: "Education",
  skills: "Skills",
  languages: "Languages",
  certifications: "Certifications",
};

const STATUS_TEXT: Record<AutosaveStatus, string> = {
  saving: "Saving…",
  saved: "Saved",
  retrying: "Not saved — retrying",
  conflict: "Not saved",
  deleted: "Not saved",
  signed_out: "Not saved",
  too_large: "Not saved — this resume is too large.",
};

export function ResumeEditor({ id, initial, updatedAt }: { id: string; initial: EditorDoc; updatedAt: string }) {
  const [doc, setDoc] = useState(initial);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [formsVersion, setFormsVersion] = useState(0);
  const autosave = useAutosave<EditorDoc>(id, updatedAt);
  const [draftDismissed, setDraftDismissed] = useState(false);
  const draftOffered =
    !draftDismissed && autosave.savedDraft !== null && JSON.stringify(autosave.savedDraft) !== JSON.stringify(initial);
  const setDraftOffered = (offered: boolean) => setDraftDismissed(!offered);

  const change = (next: EditorDoc) => {
    setDoc(next);
    autosave.update(next);
  };
  const updateContent = (patch: Partial<ResumeContent>) => change({ ...doc, content: { ...doc.content, ...patch } });

  const { order, hidden } = doc.content.layout;
  const setLayout = (layout: ResumeContent["layout"]) => updateContent({ layout });
  const move = (index: number, to: number) => {
    const next = [...order];
    [next[index], next[to]] = [next[to], next[index]];
    setLayout({ order: next, hidden });
  };

  const restoreDraft = () => {
    if (!autosave.savedDraft) return;
    change(autosave.savedDraft);
    setFormsVersion((v) => v + 1);
    setDraftOffered(false);
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/dashboard" className="text-sm font-semibold text-muted hover:text-foreground">
            ← Dashboard
          </Link>
          <TextInput
            aria-label="Resume title"
            value={doc.title}
            maxLength={200}
            onChange={(e) => change({ ...doc, title: e.target.value })}
            className="min-w-0 flex-1 basis-48 font-semibold"
          />
          <select
            aria-label="Paper size"
            className={inputClass}
            value={doc.paperSize}
            onChange={(e) => change({ ...doc, paperSize: e.target.value as PaperSize })}
          >
            {PAPER_SIZES.map((p) => (
              <option key={p} value={p}>
                {p === "Letter" ? "US Letter" : p}
              </option>
            ))}
          </select>
          <span role="status" className={`text-sm ${autosave.status === "saved" || autosave.status === "saving" ? "text-muted" : "text-red-700 dark:text-red-300"}`}>
            {STATUS_TEXT[autosave.status]}
          </span>
        </div>
        <div className="mx-auto flex w-full max-w-7xl gap-1 px-4 pb-2 lg:hidden" role="tablist">
          {(["edit", "preview"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === t ? "bg-accent text-accent-ink" : "text-muted"}`}
            >
              {t === "edit" ? "Edit" : "Preview"}
            </button>
          ))}
        </div>
      </header>

      <Banners
        status={autosave.status}
        draftOffered={draftOffered}
        onRestore={restoreDraft}
        onDiscard={() => {
          autosave.discardDraft();
          setDraftOffered(false);
        }}
        onKeepMine={() => void autosave.keepMine()}
        onLoadLatest={() => {
          autosave.discardDraft();
          window.location.reload();
        }}
      />

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div key={formsVersion} className={`flex flex-col gap-3 ${tab === "edit" ? "" : "hidden lg:flex"}`}>
          {order.map((section, index) => (
            <SectionCard
              key={section}
              title={TITLES[section]}
              hidden={hidden.includes(section)}
              canHide={section !== "contact"}
              canMoveUp={index > 1}
              canMoveDown={section !== "contact" && index < order.length - 1}
              onMoveUp={() => move(index, index - 1)}
              onMoveDown={() => move(index, index + 1)}
              onToggleHidden={() =>
                setLayout({
                  order,
                  hidden: hidden.includes(section) ? hidden.filter((s) => s !== section) : [...hidden, section],
                })
              }
              defaultOpen={index < 2}
            >
              <SectionForm section={section} content={doc.content} update={updateContent} />
            </SectionCard>
          ))}
          <details className="rounded-3xl border border-line bg-surface">
            <summary className="cursor-pointer px-4 py-3 font-bold">Target job</summary>
            <div className="flex flex-col gap-3 border-t border-line px-4 py-4">
              <p className="text-xs text-muted">The job this resume is for. Shown on your dashboard; used for tailoring later.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Job title">
                  <TextInput value={doc.jobTitle} maxLength={200} onChange={(e) => change({ ...doc, jobTitle: e.target.value })} />
                </Field>
                <Field label="Company">
                  <TextInput value={doc.jobCompany} maxLength={200} onChange={(e) => change({ ...doc, jobCompany: e.target.value })} />
                </Field>
              </div>
              <Field label="Job description">
                <TextArea rows={6} value={doc.jobDescription} maxLength={20000} onChange={(e) => change({ ...doc, jobDescription: e.target.value })} />
              </Field>
            </div>
          </details>
        </div>
        <div className={`${tab === "preview" ? "" : "hidden lg:block"}`}>
          <div className="lg:sticky lg:top-24">
            <ResumePreview content={doc.content} paperSize={doc.paperSize} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Banners({
  status,
  draftOffered,
  onRestore,
  onDiscard,
  onKeepMine,
  onLoadLatest,
}: {
  status: AutosaveStatus;
  draftOffered: boolean;
  onRestore: () => void;
  onDiscard: () => void;
  onKeepMine: () => void;
  onLoadLatest: () => void;
}) {
  const banner = "mx-auto mt-4 flex w-full max-w-7xl flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-sm";
  const button = "rounded-full border border-current px-3 py-1 font-semibold";
  return (
    <div className="px-4">
      {draftOffered && (
        <div role="alert" className={`${banner} bg-amber-500/15`}>
          <span className="flex-1">You have unsaved changes from earlier on this device.</span>
          <button className={button} onClick={onRestore}>Restore them</button>
          <button className={button} onClick={onDiscard}>Discard</button>
        </div>
      )}
      {status === "conflict" && (
        <div role="alert" className={`${banner} bg-red-500/10 text-red-800 dark:text-red-200`}>
          <span className="flex-1">This resume was changed in another tab or device.</span>
          <button className={button} onClick={onLoadLatest}>Load latest</button>
          <button className={button} onClick={onKeepMine}>Keep mine</button>
        </div>
      )}
      {status === "deleted" && (
        <div role="alert" className={`${banner} bg-red-500/10 text-red-800 dark:text-red-200`}>
          This resume was deleted. Your latest changes are kept on this device.
        </div>
      )}
      {status === "signed_out" && (
        <div role="alert" className={`${banner} bg-red-500/10 text-red-800 dark:text-red-200`}>
          <span className="flex-1">You were signed out. Sign in again — your changes are kept on this device.</span>
          <a className={button} href={`/sign-in?returnTo=${encodeURIComponent(typeof window === "undefined" ? "/dashboard" : window.location.pathname)}`}>
            Sign in
          </a>
        </div>
      )}
    </div>
  );
}
