// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { authClient } from "@/lib/auth-client";
import { SessionKeepAlive } from "@/app/dashboard/session-keep-alive";

vi.mock("@/lib/auth-client", () => ({
  authClient: { getSession: vi.fn().mockResolvedValue({ data: null, error: null }) },
}));

// Server Components can't write cookies, so the session cookie is only
// refreshed when the browser calls /api/auth/get-session. Without this,
// active users are signed out 7 days after signing in.
test("asks the auth route for the session once on mount", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.createElement("div"));
  await act(async () => root.render(<SessionKeepAlive />));
  expect(authClient.getSession).toHaveBeenCalledTimes(1);
  act(() => root.unmount());
});
