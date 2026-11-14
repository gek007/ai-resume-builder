import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { resume } from "@/lib/db/schema";
import { emptyResume, newId, type PaperSize, type ResumeContent } from "@/lib/resume/schema";

// The only code that touches the resume table. Every function takes the
// signed-in user's id and scopes every query to it, so another person's
// resume behaves exactly like a missing one.

export type ResumeSummary = {
  id: string;
  title: string;
  jobTitle: string;
  jobCompany: string;
  updatedAt: Date;
};

export type ResumeRecord = ResumeSummary & {
  content: ResumeContent;
  paperSize: PaperSize;
  jobDescription: string;
};

export type ResumeSaveInput = {
  title: string;
  content: ResumeContent;
  paperSize: PaperSize;
  jobTitle: string;
  jobCompany: string;
  jobDescription: string;
};

export type SaveResult = { status: "saved"; updatedAt: Date } | { status: "conflict" } | { status: "not_found" };

const owned = (userId: string, id: string) => and(eq(resume.id, id), eq(resume.userId, userId));

const summaryColumns = {
  id: resume.id,
  title: resume.title,
  jobTitle: resume.jobTitle,
  jobCompany: resume.jobCompany,
  updatedAt: resume.updatedAt,
};

export async function listResumes(userId: string): Promise<ResumeSummary[]> {
  return db
    .select(summaryColumns)
    .from(resume)
    .where(eq(resume.userId, userId))
    .orderBy(desc(resume.updatedAt), desc(resume.id));
}

export async function getResume(userId: string, id: string): Promise<ResumeRecord | null> {
  if (!id) return null;
  const [row] = await db
    .select({ ...summaryColumns, content: resume.content, paperSize: resume.paperSize, jobDescription: resume.jobDescription })
    .from(resume)
    .where(owned(userId, id));
  return row ?? null;
}

// Starts empty (with the account email in Contact) unless `init` gives a
// starting point, such as the demo resume.
export async function createResume(userId: string, email: string, init?: ResumeSaveInput): Promise<string> {
  const id = newId();
  const now = new Date();
  await db.insert(resume).values({
    id,
    userId,
    title: init?.title ?? "Untitled resume",
    content: init?.content ?? emptyResume(email),
    paperSize: init?.paperSize ?? "A4",
    jobTitle: init?.jobTitle ?? "",
    jobCompany: init?.jobCompany ?? "",
    jobDescription: init?.jobDescription ?? "",
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function renameResume(userId: string, id: string, title: string): Promise<boolean> {
  const rows = await db
    .update(resume)
    .set({ title, updatedAt: new Date() })
    .where(owned(userId, id))
    .returning({ id: resume.id });
  return rows.length > 0;
}

export async function duplicateResume(userId: string, id: string): Promise<string | null> {
  const source = await getResume(userId, id);
  if (!source) return null;
  const copyId = newId();
  const now = new Date();
  await db.insert(resume).values({
    id: copyId,
    userId,
    title: `${source.title} (copy)`.slice(0, 200),
    content: source.content,
    paperSize: source.paperSize,
    jobTitle: source.jobTitle,
    jobCompany: source.jobCompany,
    jobDescription: source.jobDescription,
    createdAt: now,
    updatedAt: now,
  });
  return copyId;
}

export async function deleteResume(userId: string, id: string): Promise<boolean> {
  const rows = await db.delete(resume).where(owned(userId, id)).returning({ id: resume.id });
  return rows.length > 0;
}

// Saves only if the stored updatedAt still equals `base` (the version the
// editor started from), in one conditional UPDATE. "force" skips that check
// (the person chose "Keep mine" after a conflict).
export async function saveResume(
  userId: string,
  id: string,
  input: ResumeSaveInput,
  base: Date | "force",
): Promise<SaveResult> {
  const now = new Date();
  // Strictly newer than the base, even if two saves land in the same millisecond.
  const updatedAt = base !== "force" && now.getTime() <= base.getTime() ? new Date(base.getTime() + 1) : now;
  const where = base === "force" ? owned(userId, id) : and(owned(userId, id), eq(resume.updatedAt, base));
  const rows = await db
    .update(resume)
    .set({ ...input, updatedAt })
    .where(where)
    .returning({ updatedAt: resume.updatedAt });
  if (rows.length > 0) return { status: "saved", updatedAt: rows[0].updatedAt };
  const [exists] = await db.select({ id: resume.id }).from(resume).where(owned(userId, id));
  return exists ? { status: "conflict" } : { status: "not_found" };
}
