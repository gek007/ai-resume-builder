import { magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// No baseURL: the client talks to /api/auth on whatever origin serves the page,
// which keeps preview deployments working.
export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});
