import * as z from "zod";

// The single source of truth for resume content: the editor, template, score
// rules, AI calls and import all read this shape (v1 spec §5).

export const SECTION_KEYS = [
  "contact",
  "summary",
  "experience",
  "military",
  "projects",
  "education",
  "skills",
  "languages",
  "certifications",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const LANGUAGE_LEVELS = ["native", "fluent", "professional", "conversational", "basic"] as const;
export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number];

export const PAPER_SIZES = ["A4", "Letter"] as const;
export type PaperSize = (typeof PAPER_SIZES)[number];

// Caps keep a broken or hostile client from storing huge documents.
const MAX_CONTENT_BYTES = 100 * 1024;
const short = z.string().max(200);
const id = z.string().min(1).max(64);

export const yearMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM");
const start = yearMonthSchema.nullable();
const end = z.union([yearMonthSchema, z.literal("present")]).nullable();

const bullets = z.array(z.strictObject({ id, text: z.string().max(500) })).max(30);
const entries = <T extends z.ZodType>(item: T) => z.array(item).max(30);

const workEntry = z.strictObject({
  id,
  role: short,
  organization: short,
  location: short,
  start,
  end,
  bullets,
});

export const resumeContentSchema = z
  .strictObject({
    contact: z.strictObject({
      fullName: short,
      headline: short,
      email: short,
      phone: short,
      location: short,
      links: z.array(z.strictObject({ id, label: short, url: z.string().max(500) })).max(5),
    }),
    summary: z.string().max(5000),
    experience: entries(workEntry),
    military: entries(workEntry),
    projects: entries(
      z.strictObject({ id, name: short, link: z.string().max(500), start, end, bullets }),
    ),
    education: entries(
      z.strictObject({ id, school: short, degree: short, field: short, start, end, notes: z.string().max(1000) }),
    ),
    skills: z.array(z.strictObject({ id, name: z.string().max(100) })).max(100),
    languages: entries(z.strictObject({ id, name: short, level: z.enum(LANGUAGE_LEVELS) })),
    certifications: entries(z.strictObject({ id, name: short, issuer: short, date: start })),
    layout: z.strictObject({
      order: z.array(z.enum(SECTION_KEYS)),
      hidden: z.array(z.enum(SECTION_KEYS)),
    }),
  })
  .refine(
    ({ layout }) =>
      layout.order.length === SECTION_KEYS.length &&
      new Set(layout.order).size === SECTION_KEYS.length &&
      layout.order[0] === "contact",
    { message: "layout.order must list every section once, starting with contact", path: ["layout", "order"] },
  )
  .refine(({ layout }) => !layout.hidden.includes("contact") && new Set(layout.hidden).size === layout.hidden.length, {
    message: "contact can't be hidden",
    path: ["layout", "hidden"],
  });

export type ResumeContent = z.infer<typeof resumeContentSchema>;
export type WorkEntry = ResumeContent["experience"][number];

export function newId(): string {
  return crypto.randomUUID();
}

export function emptyResume(email: string): ResumeContent {
  return {
    contact: { fullName: "", headline: "", email, phone: "", location: "", links: [] },
    summary: "",
    experience: [],
    military: [],
    projects: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
    layout: { order: [...SECTION_KEYS], hidden: [] },
  };
}

export function parseResumeContent(
  input: unknown,
): { ok: true; content: ResumeContent } | { ok: false; reason: "invalid" | "too_large" } {
  let size: number;
  try {
    size = new TextEncoder().encode(JSON.stringify(input) ?? "").length;
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (size > MAX_CONTENT_BYTES) return { ok: false, reason: "too_large" };
  const parsed = resumeContentSchema.safeParse(input);
  return parsed.success ? { ok: true, content: parsed.data } : { ok: false, reason: "invalid" };
}
