import { linkErrorMessage, requestErrorMessage } from "@/app/sign-in/error-messages";

test.each([
  [{ code: "DISPOSABLE_EMAIL", status: 400 }, "Please use a permanent email address."],
  [{ status: 429 }, "Too many attempts. Try again in a few minutes."],
  [{ code: "VERIFICATION_FAILED", status: 403 }, "Couldn't verify you're human. Please try again."],
  [{ code: "MISSING_RESPONSE", status: 400 }, "Couldn't verify you're human. Please try again."],
  [{ status: 500 }, "Couldn't send the email. Please try again."],
  [{ code: "VALIDATION_ERROR", status: 400 }, "Please enter a valid email address."],
])("requestErrorMessage(%j)", (err, msg) => {
  expect(requestErrorMessage(err)).toBe(msg);
});

test.each([
  ["INVALID_TOKEN", "That sign-in link has expired or was already used. Request a new one."],
  ["account_not_linked", "Google hasn't verified this email address. Sign in with an email link instead."],
  ["unable_to_link_account", "Google hasn't verified this email address. Sign in with an email link instead."],
  ["access_denied", "Sign-in didn't work. Please try again."],
  [undefined, null],
])("linkErrorMessage(%j)", (code, msg) => {
  expect(linkErrorMessage(code)).toBe(msg);
});
