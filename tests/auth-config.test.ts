import { assertProductionEnv, resolveAuthUrls } from "@/lib/auth/config";

describe("resolveAuthUrls", () => {
  test("production uses BETTER_AUTH_URL only", () => {
    expect(resolveAuthUrls({ BETTER_AUTH_URL: "https://app.example.com", VERCEL_URL: "x.vercel.app" })).toEqual({
      baseURL: "https://app.example.com",
      trustedOrigins: ["https://app.example.com"],
    });
  });

  test("previews trust both the deployment URL and the branch URL", () => {
    expect(
      resolveAuthUrls({ VERCEL_URL: "app-abc123.vercel.app", VERCEL_BRANCH_URL: "app-git-feat.vercel.app" }),
    ).toEqual({
      baseURL: "https://app-abc123.vercel.app",
      trustedOrigins: ["https://app-abc123.vercel.app", "https://app-git-feat.vercel.app"],
    });
  });

  test("local development without either falls back to the request origin", () => {
    expect(resolveAuthUrls({})).toEqual({ baseURL: undefined, trustedOrigins: [] });
  });
});

describe("assertProductionEnv", () => {
  const complete = {
    VERCEL_ENV: "production",
    BETTER_AUTH_URL: "https://app.example.com",
    BETTER_AUTH_SECRET: "s".repeat(32),
    TURNSTILE_SECRET_KEY: "0x4",
    RESEND_API_KEY: "re_x",
    EMAIL_FROM: "a@b.c",
  };

  test("passes when every production variable is set", () => {
    expect(() => assertProductionEnv(complete)).not.toThrow();
  });

  test.each(["BETTER_AUTH_URL", "BETTER_AUTH_SECRET", "TURNSTILE_SECRET_KEY", "RESEND_API_KEY", "EMAIL_FROM"])(
    "names %s when it is missing in production",
    (name) => {
      expect(() => assertProductionEnv({ ...complete, [name]: "" })).toThrow(name);
    },
  );

  test("does nothing outside Vercel production (local builds, previews, tests)", () => {
    expect(() => assertProductionEnv({})).not.toThrow();
    expect(() => assertProductionEnv({ VERCEL_ENV: "preview" })).not.toThrow();
  });
});
