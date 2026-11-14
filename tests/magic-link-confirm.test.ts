import { auth } from "@/lib/auth";
import { peekMagicLinkEmail, toConfirmUrl } from "@/lib/auth/magic-link-confirm";
import { lastMagicLinkUrl, randomIp, requestMagicLink, uniqueEmail, verify } from "./helpers/auth";

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

function verifyUrlFor(confirmUrl: string): URL {
  const link = new URL(confirmUrl);
  const url = new URL("/api/auth/magic-link/verify", link.origin);
  url.searchParams.set("token", link.searchParams.get("token") ?? "");
  url.searchParams.set("callbackURL", link.searchParams.get("callbackURL") ?? "/dashboard");
  url.searchParams.set("errorCallbackURL", "/sign-in");
  return url;
}

// Someone could build the verify URL from their own token and send it to a
// victim. Only our confirm page's form (a same-origin request) may use a token.
test.each(["cross-site", "none", "same-site"])(
  "verify opened with Sec-Fetch-Site %s goes to the confirm page and keeps the token",
  async (secFetchSite) => {
    await requestMagicLink(uniqueEmail());
    const confirmUrl = lastMagicLinkUrl();
    const token = new URL(confirmUrl).searchParams.get("token")!;
    const res = await auth.handler(
      new Request(verifyUrlFor(confirmUrl), { headers: { "sec-fetch-site": secFetchSite, "x-forwarded-for": randomIp() } }),
    );
    const location = new URL(res.headers.get("location") ?? "", "http://localhost:3000");
    expect(location.pathname).toBe("/sign-in/confirm");
    expect(location.searchParams.get("token")).toBe(token);
    expect(res.headers.getSetCookie().some((c) => c.includes("session_token="))).toBe(false);
    expect(await peekMagicLinkEmail(token)).not.toBeNull();
  },
);

test("verify submitted from the confirm page (same-origin) signs in", async () => {
  await requestMagicLink(uniqueEmail());
  const res = await auth.handler(
    new Request(verifyUrlFor(lastMagicLinkUrl()), { headers: { "sec-fetch-site": "same-origin", "x-forwarded-for": randomIp() } }),
  );
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
