import { isDisposableEmail } from "@/lib/auth/disposable";

test.each([
  ["a@mailinator.com", true],
  ["a@x.mailinator.com", true],
  ["A@MAILINATOR.COM ", true],
  ["a@gmail.com", false],
  ["a@example.co.il", false],
  ["not-an-email", false],
  ["", false],
])("isDisposableEmail(%j) = %s", (email, expected) => {
  expect(isDisposableEmail(email)).toBe(expected);
});
