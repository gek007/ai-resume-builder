import { auth } from "@/lib/auth";
import { randomIp, requestMagicLink, uniqueEmail } from "./helpers/auth";

vi.mock("@/lib/email", () => ({ sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined) }));

// Better Auth skips its origin and callback-URL checks under NODE_ENV=test
// unless told otherwise; these tests prove the app runs them like production.

test.each(["//evil.com", "https://evil.com/steal"])(
  "rejects a magic-link request with callbackURL %s",
  async (callbackURL) => {
    const res = await requestMagicLink(uniqueEmail(), { callbackURL });
    expect(res.status).toBe(403);
  },
);

test("rejects a magic-link request with a foreign errorCallbackURL", async () => {
  const res = await requestMagicLink(uniqueEmail(), { errorCallbackURL: "https://evil.com" });
  expect(res.status).toBe(403);
});

test("verify refuses to redirect to a foreign errorCallbackURL", async () => {
  const url = new URL("http://localhost:3000/api/auth/magic-link/verify");
  url.searchParams.set("token", "bogus");
  url.searchParams.set("errorCallbackURL", "https://evil.com");
  const res = await auth.handler(new Request(url, { headers: { "x-forwarded-for": randomIp() } }));
  expect(res.status).toBe(403);
  expect(res.headers.get("location") ?? "").not.toContain("evil.com");
});

test("rejects a cross-site POST from a foreign origin", async () => {
  const res = await requestMagicLink(uniqueEmail(), {
    headers: { origin: "https://evil.com", "sec-fetch-site": "cross-site", cookie: "x=1" },
  });
  expect(res.status).toBe(403);
});
