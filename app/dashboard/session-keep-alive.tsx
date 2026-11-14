"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

// Server Components can read the session but can't write cookies, so Better
// Auth's "extend the session while active" refresh never reaches the browser
// from them. This call goes through the /api/auth route handler, which can
// set the refreshed cookie. Render it on every signed-in screen.
export function SessionKeepAlive() {
  useEffect(() => {
    void authClient.getSession();
  }, []);
  return null;
}
