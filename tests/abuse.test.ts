import { sendMagicLinkEmail } from "@/lib/email";

vi.mock("@/lib/email", () => ({ sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined) }));

// Cloudflare's published Turnstile test secrets.
const PASS_SECRET = "1x0000000000000000000000000000000AA";
const FAIL_SECRET = "2x0000000000000000000000000000000AA";

// lib/auth reads TURNSTILE_SECRET_KEY when it loads, so each test loads a
// fresh copy of the helpers (and through them, lib/auth) with its own secret.
async function helpersWithSecret(secret: string) {
  vi.stubEnv("TURNSTILE_SECRET_KEY", secret);
  vi.resetModules();
  return import("./helpers/auth");
}

async function sendCount() {
  const { sendMagicLinkEmail: fresh } = await import("@/lib/email");
  return vi.mocked(fresh).mock.calls.length;
}

beforeEach(() => {
  vi.mocked(sendMagicLinkEmail).mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("rejects a disposable email before sending", async () => {
  const h = await helpersWithSecret(PASS_SECRET);
  const res = await h.requestMagicLink("someone@mailinator.com");
  expect(res.status).toBe(400);
  expect((await res.json()).code).toBe("DISPOSABLE_EMAIL");
  expect(await sendCount()).toBe(0);
});

test("rejects when Turnstile fails", async () => {
  const h = await helpersWithSecret(FAIL_SECRET);
  const res = await h.requestMagicLink(h.uniqueEmail());
  expect(res.status).toBe(403);
  expect(await sendCount()).toBe(0);
});

test("requires a captcha token", async () => {
  const h = await helpersWithSecret(PASS_SECRET);
  const res = await h.requestMagicLink(h.uniqueEmail(), { captcha: null });
  expect(res.status).toBe(400);
  expect(await sendCount()).toBe(0);
});

test("rate limits the 6th request from one IP within 10 minutes", async () => {
  const h = await helpersWithSecret(PASS_SECRET);
  const ip = h.randomIp();
  for (let i = 0; i < 5; i++) {
    expect((await h.requestMagicLink(h.uniqueEmail(), { ip })).status).toBe(200);
  }
  expect((await h.requestMagicLink(h.uniqueEmail(), { ip })).status).toBe(429);
});

test("rate limit is per IP", async () => {
  const h = await helpersWithSecret(PASS_SECRET);
  const ip = h.randomIp();
  for (let i = 0; i < 5; i++) await h.requestMagicLink(h.uniqueEmail(), { ip });
  expect((await h.requestMagicLink(h.uniqueEmail(), { ip: h.randomIp() })).status).toBe(200);
});
