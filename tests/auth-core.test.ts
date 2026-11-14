import { auth } from "@/lib/auth";
import { sendMagicLinkEmail } from "@/lib/email";
import {
  lastMagicLinkUrl,
  requestMagicLink,
  sessionCookieFrom,
  signInViaLink,
  uniqueEmail,
  verify,
} from "./helpers/auth";

vi.mock("@/lib/email", () => ({ sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined) }));

afterEach(() => {
  vi.useRealTimers();
});

test("magic link signs in and creates one user", async () => {
  const email = uniqueEmail();
  expect((await requestMagicLink(email)).status).toBe(200);
  const res = await verify(lastMagicLinkUrl());
  expect(res.status).toBe(302);
  expect(res.headers.get("location")).toMatch(/\/dashboard$/);
  const session = await auth.api.getSession({
    headers: new Headers({ cookie: sessionCookieFrom(res) }),
  });
  expect(session?.user.email).toBe(email);
});

test("magic link works once", async () => {
  await requestMagicLink(uniqueEmail());
  const url = lastMagicLinkUrl();
  await verify(url);
  const second = await verify(url);
  expect(second.headers.get("location")).toMatch(/\/sign-in\?error=/);
});

test("magic link expires after 15 minutes", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  await requestMagicLink(uniqueEmail());
  vi.setSystemTime(Date.now() + 15 * 60_000 + 1_000);
  const res = await verify(lastMagicLinkUrl());
  expect(res.headers.get("location")).toMatch(/\/sign-in\?error=/);
});

test("magic link still works just before 15 minutes", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  await requestMagicLink(uniqueEmail());
  vi.setSystemTime(Date.now() + 14 * 60_000);
  const res = await verify(lastMagicLinkUrl());
  expect(res.headers.get("location")).toMatch(/\/dashboard$/);
});

test("normalizes email so casing does not create a second user", async () => {
  const local = `t-${crypto.randomUUID()}`;
  const a = await signInViaLink(` ${local.toUpperCase()}@Example.com `);
  const b = await signInViaLink(`${local}@example.com`);
  expect(a.user.id).toBe(b.user.id);
  expect(b.user.email).toBe(`${local}@example.com`);
});

test("google is a trusted provider for account linking", () => {
  expect(auth.options.account?.accountLinking?.trustedProviders).toContain("google");
});

test("send failure surfaces as an error", async () => {
  vi.mocked(sendMagicLinkEmail).mockRejectedValueOnce(new Error("resend down"));
  const res = await requestMagicLink(uniqueEmail());
  expect(res.status).toBeGreaterThanOrEqual(400);
});
