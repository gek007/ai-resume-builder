import {
  createResumeAction,
  deleteResumeAction,
  duplicateResumeAction,
  renameResumeAction,
  saveResumeAction,
} from "@/app/resumes/actions";
import { createResume, getResume } from "@/lib/resume/data";
import { emptyResume } from "@/lib/resume/schema";
import { signInViaLink, uniqueEmail } from "./helpers/auth";

vi.mock("@/lib/email", () => ({ sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined) }));

let cookie = "";
vi.mock("next/headers", () => ({ headers: async () => new Headers(cookie ? { cookie } : {}) }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
const refresh = vi.fn();
vi.mock("next/cache", () => ({ refresh: () => refresh() }));

async function signIn() {
  const email = uniqueEmail();
  const session = await signInViaLink(email);
  cookie = session.cookie;
  return { id: session.user.id, email };
}

function saveInput(content: unknown = emptyResume("a@b.c")) {
  return { title: "  Frontend  ", content, paperSize: "A4", jobTitle: "FE", jobCompany: "Acme", jobDescription: "" };
}

beforeEach(() => {
  cookie = "";
  refresh.mockClear();
});

test("saveResumeAction returns unauthorized without a session", async () => {
  expect(await saveResumeAction("any", saveInput(), "force")).toEqual({ status: "unauthorized" });
});

test("saveResumeAction rejects content over the caps and malformed content", async () => {
  const me = await signIn();
  const id = await createResume(me.id, me.email);
  const huge = { ...emptyResume(me.email), summary: "x".repeat(200 * 1024) };
  expect(await saveResumeAction(id, saveInput(huge), "force")).toEqual({ status: "too_large" });
  expect(await saveResumeAction(id, saveInput({ nope: 1 }), "force")).toEqual({ status: "invalid" });
  expect(await saveResumeAction(id, { ...saveInput(), paperSize: "A3" }, "force")).toEqual({ status: "invalid" });
  expect(await saveResumeAction(id, saveInput(), "not-a-date")).toEqual({ status: "invalid" });
});

test("saveResumeAction saves and returns an ISO updatedAt; a second save with the old base returns conflict", async () => {
  const me = await signIn();
  const id = await createResume(me.id, me.email);
  const base = (await getResume(me.id, id))!.updatedAt.toISOString();
  const res = await saveResumeAction(id, saveInput(), base);
  expect(res.status).toBe("saved");
  if (res.status !== "saved") return;
  expect(new Date(res.updatedAt).toISOString()).toBe(res.updatedAt);
  expect((await getResume(me.id, id))?.title).toBe("Frontend");
  expect(await saveResumeAction(id, saveInput(), base)).toEqual({ status: "conflict" });
});

test("createResumeAction redirects to the new resume", async () => {
  await signIn();
  await expect(createResumeAction()).rejects.toThrow(/^REDIRECT:\/resumes\/[0-9a-f-]{36}$/);
});

test("rename/duplicate/delete on another user's id return ok:false", async () => {
  const owner = await signIn();
  const id = await createResume(owner.id, owner.email);
  await signIn(); // now signed in as someone else
  expect(await renameResumeAction(id, "x")).toEqual({ ok: false });
  expect(await duplicateResumeAction(id)).toEqual({ ok: false });
  expect(await deleteResumeAction(id)).toEqual({ ok: false });
  expect(await getResume(owner.id, id)).not.toBeNull();
});

test("rename trims, caps and falls back to Untitled; owner actions refresh", async () => {
  const me = await signIn();
  const id = await createResume(me.id, me.email);
  expect(await renameResumeAction(id, "   ")).toEqual({ ok: true });
  expect((await getResume(me.id, id))?.title).toBe("Untitled resume");
  await renameResumeAction(id, "y".repeat(300));
  expect((await getResume(me.id, id))?.title).toHaveLength(200);
  expect(await duplicateResumeAction(id)).toEqual({ ok: true });
  expect(await deleteResumeAction(id)).toEqual({ ok: true });
  expect(refresh).toHaveBeenCalledTimes(4);
});

test("mutations without a session redirect to sign-in", async () => {
  await expect(renameResumeAction("x", "y")).rejects.toThrow(/^REDIRECT:\/sign-in/);
});
