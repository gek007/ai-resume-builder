import {
  SECTION_KEYS,
  emptyResume,
  newId,
  parseResumeContent,
  resumeContentSchema,
  type ResumeContent,
} from "@/lib/resume/schema";

function withExperience(bullets: string[], end: unknown = "present"): unknown {
  const r = emptyResume("a@b.c");
  return {
    ...r,
    experience: [
      {
        id: newId(),
        role: "Engineer",
        organization: "Acme",
        location: "",
        start: "2024-01",
        end,
        bullets: bullets.map((text) => ({ id: newId(), text })),
      },
    ],
  };
}

test("emptyResume passes the schema, carries the email, and lists all sections in order", () => {
  const r = emptyResume("a@b.c");
  expect(resumeContentSchema.safeParse(r).success).toBe(true);
  expect(r.contact.email).toBe("a@b.c");
  expect(r.layout.order).toEqual([...SECTION_KEYS]);
  expect(r.layout.hidden).toEqual([]);
});

test("layout.order must contain each section exactly once and start with contact", () => {
  const r = emptyResume("a@b.c");
  const missing = { ...r, layout: { ...r.layout, order: SECTION_KEYS.slice(1) } };
  const dup = { ...r, layout: { ...r.layout, order: [...SECTION_KEYS, "skills"] } };
  const notFirst = { ...r, layout: { ...r.layout, order: [...SECTION_KEYS.slice(1), "contact"] } };
  for (const bad of [missing, dup, notFirst]) expect(resumeContentSchema.safeParse(bad).success).toBe(false);
});

test("contact can't be hidden", () => {
  const r = emptyResume("a@b.c");
  expect(resumeContentSchema.safeParse({ ...r, layout: { ...r.layout, hidden: ["contact"] } }).success).toBe(false);
  expect(resumeContentSchema.safeParse({ ...r, layout: { ...r.layout, hidden: ["projects"] } }).success).toBe(true);
});

test("rejects a bullet over 500 chars and more than 30 bullets", () => {
  expect(resumeContentSchema.safeParse(withExperience(["x".repeat(500)])).success).toBe(true);
  expect(resumeContentSchema.safeParse(withExperience(["x".repeat(501)])).success).toBe(false);
  expect(resumeContentSchema.safeParse(withExperience(Array(31).fill("ok"))).success).toBe(false);
});

test('accepts end "present" and rejects "2024-13"', () => {
  expect(resumeContentSchema.safeParse(withExperience(["ok"], "present")).success).toBe(true);
  expect(resumeContentSchema.safeParse(withExperience(["ok"], null)).success).toBe(true);
  expect(resumeContentSchema.safeParse(withExperience(["ok"], "2024-12")).success).toBe(true);
  expect(resumeContentSchema.safeParse(withExperience(["ok"], "2024-13")).success).toBe(false);
});

test("parseResumeContent reports too_large over 100 KB and invalid for bad shapes", () => {
  const r = emptyResume("a@b.c");
  const huge = { ...r, summary: "x".repeat(101 * 1024) };
  expect(parseResumeContent(huge)).toEqual({ ok: false, reason: "too_large" });
  expect(parseResumeContent({ nope: true })).toEqual({ ok: false, reason: "invalid" });
  const ok = parseResumeContent(r);
  expect(ok.ok && ok.content.contact.email).toBe("a@b.c");
});

test("rejects unknown keys", () => {
  const r = emptyResume("a@b.c") as ResumeContent & { extra?: string };
  expect(resumeContentSchema.safeParse({ ...r, extra: "x" }).success).toBe(false);
  expect(
    resumeContentSchema.safeParse({ ...r, contact: { ...r.contact, password: "x" } }).success,
  ).toBe(false);
});
