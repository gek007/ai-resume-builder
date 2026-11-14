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
])("safeReturnTo(%j) = %j", (input, out) => {
  expect(safeReturnTo(input)).toBe(out);
});
