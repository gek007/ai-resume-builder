import { safeReturnTo } from "@/lib/auth/safe-redirect";

test.each([
  ["/resumes/abc?tab=score", "/resumes/abc?tab=score"],
  ["/dashboard", "/dashboard"],
  [null, "/dashboard"],
  [undefined, "/dashboard"],
  ["", "/dashboard"],
  ["//evil.com", "/dashboard"],
  ["/\\evil.com", "/dashboard"],
  ["https://evil.com", "/dashboard"],
  ["%2F%2Fevil.com", "/dashboard"],
  ["/%2F%2Fevil.com", "/dashboard"],
  ["javascript:alert(1)", "/dashboard"],
  ["/sign-in", "/dashboard"],
  ["/sign-in?returnTo=%2Fdashboard", "/dashboard"],
  ["%E0%A4%A", "/dashboard"],
  ["/api/auth/magic-link/verify?token=attacker", "/dashboard"],
  ["/api", "/dashboard"],
  ["/%61pi/auth/sign-out", "/dashboard"],
  ["/apiary", "/apiary"],
  // Dot segments: browsers resolve these before requesting, so check the result.
  ["/x/../api/auth/magic-link/verify?token=a", "/dashboard"],
  ["/./sign-in", "/dashboard"],
  ["/%2e%2e/api/auth/sign-out", "/dashboard"],
  ["/x\\..\\api/auth/sign-out", "/dashboard"],
  ["/resumes/./1?tab=score#top", "/resumes/1?tab=score#top"],
])("safeReturnTo(%j) = %j", (input, out) => {
  expect(safeReturnTo(input)).toBe(out);
});
