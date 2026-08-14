import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validation/auth";

export interface VerifiedUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TUTOR";
}

/**
 * Verifies an email/password pair against the database. Returns null for
 * any failure case (bad input, unknown email, disabled account, wrong
 * password) without distinguishing which, so callers never leak which
 * part of a login attempt was wrong.
 */
export async function verifyCredentials(
  credentials: Partial<Record<string, unknown>>
): Promise<VerifiedUser | null> {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return null;

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) return null;

  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
