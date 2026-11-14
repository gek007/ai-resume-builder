import { isDisposableEmailDomain } from "disposable-email-domains-js";

// True when the address is on a throwaway-email domain or one of its
// subdomains (x.mailinator.com counts as mailinator.com).
export function isDisposableEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at < 1 || at === normalized.length - 1) return false;
  return isDisposableEmailDomain(normalized.slice(at + 1));
}
