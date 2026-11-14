import { safeReturnTo } from "@/lib/auth/safe-redirect";

// Turns Better Auth's verify URL into a link to our confirm page. The emailed
// link must not sign anyone in by itself: email link scanners open every link
// (which would use the token up), and a link sent by someone else could sign a
// victim into the sender's account. The confirm page asks first.
export function toConfirmUrl(verifyUrl: string): string {
  const verify = new URL(verifyUrl);
  const confirm = new URL("/sign-in/confirm", verify.origin);
  confirm.searchParams.set("token", verify.searchParams.get("token") ?? "");
  confirm.searchParams.set("callbackURL", safeReturnTo(verify.searchParams.get("callbackURL")));
  return confirm.toString();
}
