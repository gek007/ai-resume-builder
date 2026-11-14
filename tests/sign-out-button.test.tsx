// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { authClient } from "@/lib/auth-client";
import { SignOutButton } from "@/app/dashboard/sign-out-button";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh: vi.fn() }) }));
vi.mock("@/lib/auth-client", () => ({ authClient: { signOut: vi.fn() } }));

async function renderAndClick() {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  await act(async () => root.render(<SignOutButton />));
  await act(async () => container.querySelector("button")!.click());
  return container;
}

beforeEach(() => replace.mockClear());

test("goes home after signing out", async () => {
  vi.mocked(authClient.signOut).mockResolvedValue({ data: { success: true }, error: null } as never);
  await renderAndClick();
  expect(replace).toHaveBeenCalledWith("/");
});

test("stays put and says so when sign-out fails", async () => {
  vi.mocked(authClient.signOut).mockResolvedValue({ data: null, error: { status: 500 } } as never);
  const container = await renderAndClick();
  expect(replace).not.toHaveBeenCalled();
  expect(container.textContent).toContain("Couldn't sign out");
  expect(container.querySelector("button")!.disabled).toBe(false);
});
