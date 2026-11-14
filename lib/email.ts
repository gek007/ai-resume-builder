import "server-only";
import { Resend } from "resend";
import { siteConfig } from "@/lib/site-config";

export async function sendMagicLinkEmail({ email, url }: { email: string; url: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const isProduction = process.env.NODE_ENV === "production";

  if (!apiKey && !isProduction) {
    // Local development without an email provider: the link goes to the server log.
    console.info("[magic link]", email, url);
    return;
  }
  // Production must never fall back to logging the link.
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  if (!from) throw new Error("EMAIL_FROM is not set");

  const subject = `Sign in to ${siteConfig.name}`;
  const text = `Click the link below to sign in to ${siteConfig.name}.\n\n${url}\n\nThe link expires in 15 minutes and works once. If you didn't ask for it, you can ignore this email.`;
  const html = `<p>Click the link below to sign in to ${escapeHtml(siteConfig.name)}.</p><p><a href="${escapeHtml(url)}">Sign in</a></p><p>The link expires in 15 minutes and works once. If you didn't ask for it, you can ignore this email.</p>`;

  const { error } = await new Resend(apiKey).emails.send({ from, to: email, subject, text, html });
  if (error) throw new Error(`Resend failed: ${error.message}`);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
