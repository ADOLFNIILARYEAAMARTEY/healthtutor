"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { createUserSchema } from "@/lib/validation/users";
import { assertAdmin, PermissionError } from "@/lib/permissions";

export interface UserFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

export async function createUserAction(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  try {
    await assertAdmin();
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  const parsed = createUserSchema.safeParse({
    name: (formData.get("name") as string)?.trim(),
    email: (formData.get("email") as string)?.trim(),
    role: formData.get("role"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "A user with this email already exists." };
    }
    return { error: "Unable to create user right now. Please try again." };
  }

  revalidatePath("/users");
  revalidatePath("/tutors");
  return { success: true };
}

export interface SimpleResult {
  error?: string;
  success?: boolean;
}

export async function toggleUserStatusAction(
  targetUserId: string,
  isActive: boolean
): Promise<SimpleResult> {
  let admin;
  try {
    admin = await assertAdmin();
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  if (!isActive && admin.id === targetUserId) {
    return { error: "You cannot disable your own account." };
  }

  await prisma.user.update({ where: { id: targetUserId }, data: { isActive } });
  revalidatePath("/users");
  revalidatePath("/tutors");
  return { success: true };
}
