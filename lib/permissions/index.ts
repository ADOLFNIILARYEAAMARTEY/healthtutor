import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const PERMISSION_DENIED_MESSAGE =
  "You do not have permission to access this page.";

export class PermissionError extends Error {}

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
}

/** For Server Components: redirects to /login if unauthenticated. */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user as SessionUser;
}

/** For Server Components: redirects to /unauthorized if not an admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/unauthorized");
  return user;
}

/**
 * For Server Actions: returns the session user or null. Never trusts a
 * role passed in from the client — always re-derives it from the signed
 * session on the server.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  return (session?.user as SessionUser | undefined) ?? null;
}

/** For Server Actions: throws PermissionError instead of redirecting. */
export async function assertAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new PermissionError(PERMISSION_DENIED_MESSAGE);
  if (user.role !== "ADMIN") throw new PermissionError(PERMISSION_DENIED_MESSAGE);
  return user;
}

export async function assertAuthenticated(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new PermissionError(PERMISSION_DENIED_MESSAGE);
  return user;
}

/**
 * Tutors may only act on courses assigned to them; admins may act on any
 * course. Throws PermissionError otherwise.
 */
export async function assertCourseAccess(
  courseId: string,
  user: SessionUser
): Promise<void> {
  if (user.role === "ADMIN") return;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { tutorId: true },
  });

  if (!course || course.tutorId !== user.id) {
    throw new PermissionError(PERMISSION_DENIED_MESSAGE);
  }
}
