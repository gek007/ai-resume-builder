"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function signOut() {
    setPending(true);
    setFailed(false);
    const { error } = await authClient.signOut();
    if (error) {
      // Still signed in: say so instead of pretending.
      setPending(false);
      setFailed(true);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <span className="flex shrink-0 items-center gap-2">
      {failed && (
        <span role="alert" className="text-red-700 dark:text-red-300">
          Couldn&apos;t sign out. Try again.
        </span>
      )}
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className="rounded-full border border-line px-4 py-2 font-semibold hover:bg-surface disabled:opacity-50"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </span>
  );
}
