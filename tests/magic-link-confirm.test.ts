import { peekMagicLinkEmail, toConfirmUrl } from "@/lib/auth/magic-link-confirm";
import { lastMagicLinkUrl, requestMagicLink, uniqueEmail, verify } from "./helpers/auth";

vi.mock("@/lib/email", () => ({ sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined) }));

afterEach(() => {
  vi.useRealTimers();
});

const VERIFY =
  "http://localhost:3000/api/auth/magic-link/verify?token=abc123&callbackURL=%2Fresumes%2F1&errorCallbackURL=%2Fsign-in";

test("toConfirmUrl points at the confirm page with the token and return path", () => {
  const url = new URL(toConfirmUrl(VERIFY));
  expect(url.origin).toBe("http://localhost:3000");
  expect(url.pathname).toBe("/sign-in/confirm");
  expect(url.searchParams.get("token")).toBe("abc123");
  expect(url.searchParams.get("callbackURL")).toBe("/resumes/1");
  expect(url.searchParams.has("email")).toBe(false);
});

test("toConfirmUrl drops an unsafe return path", () => {
  const url = new URL(toConfirmUrl(VERIFY.replace("%2Fresumes%2F1", "%2F%2Fevil.com")));
  expect(url.searchParams.get("callbackURL")).toBe("/dashboard");
});

test("the emailed link is the confirm page, not the verify endpoint", async () => {
  await requestMagicLink(uniqueEmail());
  expect(new URL(lastMagicLinkUrl()).pathname).toBe("/sign-in/confirm");
});

test("peek returns the email the link was requested for", async () => {
  const email = uniqueEmail();
  await requestMagicLink(email);
  const token = new URL(lastMagicLinkUrl()).searchParams.get("token")!;
  expect(await peekMagicLinkEmail(token)).toBe(email);
});

test("opening the confirm page (a link scanner) does not use up the link", async () => {
  await requestMagicLink(uniqueEmail());
  const token = new URL(lastMagicLinkUrl()).searchParams.get("token")!;
  await peekMagicLinkEmail(token);
  await peekMagicLinkEmail(token);
  const res = await verify(lastMagicLinkUrl());
  expect(res.headers.get("location")).toMatch(/\/dashboard$/);
});

test("peek returns null once the link was used", async () => {
  await requestMagicLink(uniqueEmail());
  const token = new URL(lastMagicLinkUrl()).searchParams.get("token")!;
  await verify(lastMagicLinkUrl());
  expect(await peekMagicLinkEmail(token)).toBeNull();
});

test("peek returns null for an unknown token", async () => {
  expect(await peekMagicLinkEmail("not-a-real-token")).toBeNull();
  expect(await peekMagicLinkEmail("")).toBeNull();
});

test("peek returns null after the link expires", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  await requestMagicLink(uniqueEmail());
  const token = new URL(lastMagicLinkUrl()).searchParams.get("token")!;
  vi.setSystemTime(Date.now() + 15 * 60_000 + 1_000);
  expect(await peekMagicLinkEmail(token)).toBeNull();
});
