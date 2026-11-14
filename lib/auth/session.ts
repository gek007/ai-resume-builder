import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { safeReturnTo } from "@/lib/auth/safe-redirect";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

// Reads the session from the database. With cacheComponents on, call this
// only inside a <Suspense> boundary.
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, email, name, image } = session.user;
  return { id, email, name, image: image ?? null };
}

// The real access check for every protected page, action and route.
// proxy.ts only does a fast cookie check and is never trusted on its own.
export async function requireUser(returnTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`);
  return user;
}
