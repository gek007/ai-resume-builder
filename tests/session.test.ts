import { requireUser } from "@/lib/auth/session";
import { signInViaLink, uniqueEmail } from "./helpers/auth";

vi.mock("@/lib/email", () => ({ sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined) }));

let cookie = "";
vi.mock("next/headers", () => ({
  headers: async () => new Headers(cookie ? { cookie } : {}),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

beforeEach(() => {
  cookie = "";
});

test("requireUser returns the user for a valid session", async () => {
  const email = uniqueEmail();
  const session = await signInViaLink(email);
  cookie = session.cookie;
  await expect(requireUser()).resolves.toMatchObject({ email, id: session.user.id });
});

test("requireUser redirects on no cookie", async () => {
  await expect(requireUser()).rejects.toThrow("REDIRECT:/sign-in?returnTo=%2Fdashboard");
});

test("requireUser redirects on an unknown session token", async () => {
  cookie = "better-auth.session_token=forged.value";
  await expect(requireUser()).rejects.toThrow("REDIRECT:/sign-in?returnTo=%2Fdashboard");
});

test("requireUser keeps a safe returnTo and drops an unsafe one", async () => {
  await expect(requireUser("/resumes/1")).rejects.toThrow("REDIRECT:/sign-in?returnTo=%2Fresumes%2F1");
  await expect(requireUser("//evil.com")).rejects.toThrow("REDIRECT:/sign-in?returnTo=%2Fdashboard");
});
