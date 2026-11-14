"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { linkErrorMessage, requestErrorMessage } from "./error-messages";

type Props = {
  returnTo: string;
  error?: string;
  googleEnabled: boolean;
  turnstileSiteKey: string | null;
};

export function SignInForm({ returnTo, error, googleEnabled, turnstileSiteKey }: Props) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState<string | null>(linkErrorMessage(error));
  const turnstile = useRef<TurnstileInstance>(null);

  async function sendLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setStatus("sending");
    setMessage(null);
    const { error: requestError } = await authClient.signIn.magicLink({
      email: email.trim(),
      callbackURL: returnTo,
      errorCallbackURL: "/sign-in",
      fetchOptions: { headers: { "x-captcha-response": token } },
    });
    // A Turnstile token works once, so get a fresh one for the next attempt.
    turnstile.current?.reset();
    setToken(null);
    if (requestError) {
      setStatus("idle");
      setMessage(requestErrorMessage(requestError));
      return;
    }
    setStatus("sent");
  }

  async function signInWithGoogle() {
    setMessage(null);
    const { error: googleError } = await authClient.signIn.social({
      provider: "google",
      callbackURL: returnTo,
      errorCallbackURL: "/sign-in",
    });
    if (googleError) setMessage("Couldn't start Google sign-in. Please try again.");
  }

  if (status === "sent") {
    return (
      <div className="mt-8" role="status">
        <h2 className="text-lg font-bold">Check your email</h2>
        <p className="mt-2 text-sm text-muted">
          We sent a sign-in link to <span className="font-semibold text-foreground">{email.trim()}</span>.
          It expires in 15 minutes.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-semibold text-accent hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      {message && (
        <p role="alert" className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {message}
        </p>
      )}

      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="rounded-full border border-line bg-surface px-5 py-3 font-semibold hover:bg-background"
          >
            Continue with Google
          </button>
          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      {turnstileSiteKey ? (
        <form onSubmit={sendLink} className="flex flex-col gap-3">
          <label htmlFor="email" className="text-sm font-semibold">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
          <Turnstile
            ref={turnstile}
            siteKey={turnstileSiteKey}
            onSuccess={setToken}
            onExpire={() => setToken(null)}
            onError={() => setToken(null)}
            options={{ size: "flexible", theme: "auto" }}
          />
          <button
            type="submit"
            disabled={!token || status === "sending"}
            className="rounded-full bg-accent px-5 py-3 font-semibold text-accent-ink hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : "Email me a sign-in link"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-muted">Email sign-in isn&apos;t available right now.</p>
      )}
    </div>
  );
}
