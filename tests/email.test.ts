import { sendMagicLinkEmail } from "@/lib/email";

const args = { email: "ana@example.com", url: "http://localhost:3000/api/auth/magic-link/verify?token=t" };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

test("logs the link in development when RESEND_API_KEY is unset", async () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("RESEND_API_KEY", "");
  const info = vi.spyOn(console, "info").mockImplementation(() => {});
  await sendMagicLinkEmail(args);
  expect(info).toHaveBeenCalledWith(expect.any(String), args.email, args.url);
});

test("throws in production when RESEND_API_KEY is unset", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("RESEND_API_KEY", "");
  vi.stubEnv("EMAIL_FROM", "auth@example.com");
  const info = vi.spyOn(console, "info").mockImplementation(() => {});
  await expect(sendMagicLinkEmail(args)).rejects.toThrow(/RESEND_API_KEY/);
  expect(info).not.toHaveBeenCalled();
});

test("throws in production when EMAIL_FROM is unset", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("EMAIL_FROM", "");
  await expect(sendMagicLinkEmail(args)).rejects.toThrow(/EMAIL_FROM/);
});
