import { createDemoResumeAction } from "@/app/resumes/actions";
import { getResume, listResumes } from "@/lib/resume/data";
import { demoResume } from "@/lib/resume/demo";
import { SECTION_KEYS, resumeContentSchema } from "@/lib/resume/schema";
import { signInViaLink, uniqueEmail } from "./helpers/auth";

vi.mock("@/lib/email", () => ({ sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined) }));

let cookie = "";
vi.mock("next/headers", () => ({ headers: async () => new Headers(cookie ? { cookie } : {}) }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

test("the demo resume passes the schema and fills every section", () => {
  const demo = demoResume();
  expect(resumeContentSchema.safeParse(demo.content).success).toBe(true);
  for (const key of SECTION_KEYS.filter((k) => k !== "contact" && k !== "summary")) {
    expect(demo.content[key], key).not.toHaveLength(0);
  }
  expect(demo.content.contact.fullName).not.toBe("");
  expect(demo.content.summary).not.toBe("");
  expect(demo.jobTitle).not.toBe("");
});

test("each demo resume gets fresh ids", () => {
  expect(demoResume().content.experience[0].id).not.toBe(demoResume().content.experience[0].id);
});

test("createDemoResumeAction creates a filled resume for the signed-in user and opens it", async () => {
  const email = uniqueEmail();
  const session = await signInViaLink(email);
  cookie = session.cookie;
  const err = await createDemoResumeAction().catch((e: Error) => e);
  const match = String(err).match(/REDIRECT:\/resumes\/([0-9a-f-]{36})$/);
  expect(match).not.toBeNull();
  const resume = await getResume(session.user.id, match![1]);
  expect(resume?.title).toBe("Demo resume");
  expect(resume?.content.experience.length).toBeGreaterThan(0);
  expect(resume?.jobCompany).not.toBe("");
  expect(await listResumes(session.user.id)).toHaveLength(1);
});
