"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { getCurrentUser, requireUser } from "@/lib/auth/session";
import {
  createResume,
  deleteResume,
  duplicateResume,
  renameResume,
  saveResume,
} from "@/lib/resume/data";
import { demoResume } from "@/lib/resume/demo";
import { PAPER_SIZES, parseResumeContent } from "@/lib/resume/schema";

export type SaveActionResult =
  | { status: "saved"; updatedAt: string }
  | { status: "conflict" | "not_found" | "invalid" | "too_large" | "unauthorized" };

const DEFAULT_TITLE = "Untitled resume";

function cleanTitle(title: unknown): string {
  const t = typeof title === "string" ? title.trim().slice(0, 200) : "";
  return t || DEFAULT_TITLE;
}

const saveMeta = z.object({
  title: z.string(),
  content: z.unknown(),
  paperSize: z.enum(PAPER_SIZES),
  jobTitle: z.string().max(200),
  jobCompany: z.string().max(200),
  jobDescription: z.string().max(20_000),
});

function parseBase(base: unknown): Date | "force" | null {
  if (base === "force") return "force";
  if (typeof base !== "string") return null;
  const d = new Date(base);
  return Number.isNaN(d.getTime()) || d.toISOString() !== base ? null : d;
}

export async function createResumeAction(): Promise<void> {
  const user = await requireUser("/dashboard");
  const id = await createResume(user.id, user.email);
  redirect(`/resumes/${id}`);
}

// A new resume pre-filled with the sample content, to try the editor quickly.
export async function createDemoResumeAction(): Promise<void> {
  const user = await requireUser("/dashboard");
  const id = await createResume(user.id, user.email, demoResume());
  redirect(`/resumes/${id}`);
}

export async function renameResumeAction(id: string, title: string): Promise<{ ok: boolean }> {
  const user = await requireUser("/dashboard");
  const ok = await renameResume(user.id, String(id), cleanTitle(title));
  if (ok) refresh();
  return { ok };
}

export async function duplicateResumeAction(id: string): Promise<{ ok: boolean }> {
  const user = await requireUser("/dashboard");
  const ok = (await duplicateResume(user.id, String(id))) !== null;
  if (ok) refresh();
  return { ok };
}

export async function deleteResumeAction(id: string): Promise<{ ok: boolean }> {
  const user = await requireUser("/dashboard");
  const ok = await deleteResume(user.id, String(id));
  if (ok) refresh();
  return { ok };
}

// Called by autosave. Never redirects: an expired session returns
// "unauthorized" so the editor can keep the person's edits on the device.
export async function saveResumeAction(id: string, input: unknown, base: string): Promise<SaveActionResult> {
  const user = await getCurrentUser();
  if (!user) return { status: "unauthorized" };

  const meta = saveMeta.safeParse(input);
  const parsedBase = parseBase(base);
  if (!meta.success || !parsedBase) return { status: "invalid" };
  const content = parseResumeContent(meta.data.content);
  if (!content.ok) return { status: content.reason };

  const result = await saveResume(
    user.id,
    String(id),
    {
      title: cleanTitle(meta.data.title),
      content: content.content,
      paperSize: meta.data.paperSize,
      jobTitle: meta.data.jobTitle,
      jobCompany: meta.data.jobCompany,
      jobDescription: meta.data.jobDescription,
    },
    parsedBase,
  );
  return result.status === "saved" ? { status: "saved", updatedAt: result.updatedAt.toISOString() } : result;
}
