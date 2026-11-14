import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { resume, user } from "@/lib/db/schema";
import {
  createResume,
  deleteResume,
  duplicateResume,
  getResume,
  listResumes,
  renameResume,
  saveResume,
  type ResumeSaveInput,
} from "@/lib/resume/data";
import { emptyResume } from "@/lib/resume/schema";

async function makeUser() {
  const id = crypto.randomUUID();
  const email = `u-${id}@example.com`;
  await db.insert(user).values({ id, name: "", email, emailVerified: true });
  return { id, email };
}

function input(overrides: Partial<ResumeSaveInput> = {}): ResumeSaveInput {
  return {
    title: "My resume",
    content: emptyResume("a@b.c"),
    paperSize: "A4",
    jobTitle: "",
    jobCompany: "",
    jobDescription: "",
    ...overrides,
  };
}

test("create then list shows only the owner's resumes, newest first", async () => {
  const a = await makeUser();
  const b = await makeUser();
  const first = await createResume(a.id, a.email);
  const second = await createResume(a.id, a.email);
  await createResume(b.id, b.email);
  const list = await listResumes(a.id);
  expect(list.map((r) => r.id)).toEqual([second, first]);
  expect(list[0].title).toBe("Untitled resume");
  const created = await getResume(a.id, first);
  expect(created?.content.contact.email).toBe(a.email);
  expect(created?.paperSize).toBe("A4");
});

test("getResume returns null for another user's id and for a malformed id", async () => {
  const a = await makeUser();
  const b = await makeUser();
  const id = await createResume(a.id, a.email);
  expect(await getResume(b.id, id)).toBeNull();
  expect(await getResume(a.id, "not-a-uuid")).toBeNull();
  expect(await getResume(a.id, "")).toBeNull();
});

test("user B can't rename, duplicate, delete or save user A's resume", async () => {
  const a = await makeUser();
  const b = await makeUser();
  const id = await createResume(a.id, a.email);
  const before = await getResume(a.id, id);
  expect(await renameResume(b.id, id, "Hacked")).toBe(false);
  expect(await duplicateResume(b.id, id)).toBeNull();
  expect(await deleteResume(b.id, id)).toBe(false);
  expect(await saveResume(b.id, id, input({ title: "Hacked" }), "force")).toEqual({ status: "not_found" });
  expect(await saveResume(b.id, id, input({ title: "Hacked" }), before!.updatedAt)).toEqual({ status: "not_found" });
  expect(await getResume(a.id, id)).toEqual(before);
  expect(await listResumes(b.id)).toEqual([]);
});

test("saveResume with the current updatedAt saves and returns a newer updatedAt", async () => {
  const a = await makeUser();
  const id = await createResume(a.id, a.email);
  const base = (await getResume(a.id, id))!.updatedAt;
  const content = { ...emptyResume(a.email), summary: "Hello" };
  const res = await saveResume(a.id, id, input({ title: "Saved", content, paperSize: "Letter", jobCompany: "Acme" }), base);
  expect(res.status).toBe("saved");
  if (res.status !== "saved") return;
  expect(res.updatedAt.getTime()).toBeGreaterThan(base.getTime());
  const after = await getResume(a.id, id);
  expect(after).toMatchObject({ title: "Saved", paperSize: "Letter", jobCompany: "Acme", updatedAt: res.updatedAt });
  expect(after?.content.summary).toBe("Hello");
});

test("saveResume with a stale updatedAt returns conflict and changes nothing", async () => {
  const a = await makeUser();
  const id = await createResume(a.id, a.email);
  const base = (await getResume(a.id, id))!.updatedAt;
  await saveResume(a.id, id, input({ title: "Tab 1" }), base);
  const snapshot = await getResume(a.id, id);
  expect(await saveResume(a.id, id, input({ title: "Tab 2" }), base)).toEqual({ status: "conflict" });
  expect(await getResume(a.id, id)).toEqual(snapshot);
});

test('saveResume with "force" overwrites', async () => {
  const a = await makeUser();
  const id = await createResume(a.id, a.email);
  const base = (await getResume(a.id, id))!.updatedAt;
  await saveResume(a.id, id, input({ title: "Tab 1" }), base);
  const res = await saveResume(a.id, id, input({ title: "Tab 2" }), "force");
  expect(res.status).toBe("saved");
  expect((await getResume(a.id, id))?.title).toBe("Tab 2");
});

test('duplicate copies content and job fields with a new id and "(copy)" title', async () => {
  const a = await makeUser();
  const id = await createResume(a.id, a.email);
  const base = (await getResume(a.id, id))!.updatedAt;
  const content = { ...emptyResume(a.email), summary: "Original" };
  await saveResume(a.id, id, input({ title: "Frontend", content, jobTitle: "FE", jobCompany: "Acme", jobDescription: "JD" }), base);
  const copyId = await duplicateResume(a.id, id);
  expect(copyId).not.toBeNull();
  expect(copyId).not.toBe(id);
  const copy = await getResume(a.id, copyId!);
  expect(copy).toMatchObject({ title: "Frontend (copy)", jobTitle: "FE", jobCompany: "Acme", jobDescription: "JD" });
  expect(copy?.content.summary).toBe("Original");
});

test("rename and delete work for the owner", async () => {
  const a = await makeUser();
  const id = await createResume(a.id, a.email);
  expect(await renameResume(a.id, id, "Renamed")).toBe(true);
  expect((await getResume(a.id, id))?.title).toBe("Renamed");
  expect(await deleteResume(a.id, id)).toBe(true);
  expect(await getResume(a.id, id)).toBeNull();
  expect(await saveResume(a.id, id, input(), "force")).toEqual({ status: "not_found" });
});

test("deleting the user deletes their resumes", async () => {
  const a = await makeUser();
  const id = await createResume(a.id, a.email);
  await db.delete(user).where(eq(user.id, a.id));
  expect(await db.select().from(resume).where(eq(resume.id, id))).toEqual([]);
});
