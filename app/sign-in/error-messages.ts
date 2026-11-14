// Copy for errors from the "email me a link" request.
export function requestErrorMessage(error: { code?: string; status?: number }): string {
  if (error.code === "DISPOSABLE_EMAIL") return "Please use a permanent email address.";
  if (error.status === 429) return "Too many attempts. Try again in a few minutes.";
  if (error.code === "VERIFICATION_FAILED" || error.code === "MISSING_RESPONSE") {
    return "Couldn't verify you're human. Please try again.";
  }
  if (error.code === "VALIDATION_ERROR" || error.code === "INVALID_EMAIL") {
    return "Please enter a valid email address.";
  }
  return "Couldn't send the email. Please try again.";
}

const LINK_USED = "That sign-in link has expired or was already used. Request a new one.";
const GOOGLE_UNVERIFIED =
  "Google hasn't verified this email address. Sign in with an email link instead.";

// Copy for the `?error=` code Better Auth adds when a magic link or Google
// sign-in fails and sends the browser back to /sign-in.
export function linkErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  // Better Auth reports used and expired magic links alike as INVALID_TOKEN.
  if (code === "INVALID_TOKEN") return LINK_USED;
  if (code === "account_not_linked" || code === "unable_to_link_account") return GOOGLE_UNVERIFIED;
  return "Sign-in didn't work. Please try again.";
}
