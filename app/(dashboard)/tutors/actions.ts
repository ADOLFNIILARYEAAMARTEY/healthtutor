"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { createTutorSchema, updateTutorSchema } from "@/lib/validation/tutors";
import { assertAdmin, PermissionError } from "@/lib/permissions";

export interface TutorFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

function fieldErrorsFromZod(error: import("zod").ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as string;
    if (key) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

function mapUserDbError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return "A user with this email already exists.";
  }
  return "Unable to save tutor right now. Please try again.";
}

export async function createTutorAction(
  _prevState: TutorFormState,
  formData: FormData
): Promise<TutorFormState> {
  try {
    await assertAdmin();
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  const parsed = createTutorSchema.safeParse({
    name: (formData.get("name") as string)?.trim(),
    email: (formData.get("email") as string)?.trim(),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFromZod(parsed.error) };

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: "TUTOR",
      },
    });
  } catch (error) {
    return { error: mapUserDbError(error) };
  }

  revalidatePath("/tutors");
  return { success: true };
}

export async function updateTutorAction(
  tutorId: string,
  _prevState: TutorFormState,
  formData: FormData
): Promise<TutorFormState> {
  try {
    await assertAdmin();
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  const parsed = updateTutorSchema.safeParse({
    name: (formData.get("name") as string)?.trim(),
    email: (formData.get("email") as string)?.trim(),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFromZod(parsed.error) };

  try {
    await prisma.user.update({ where: { id: tutorId }, data: parsed.data });
  } catch (error) {
    return { error: mapUserDbError(error) };
  }

  revalidatePath("/tutors");
  return { success: true };
}

export interface SimpleResult {
  error?: string;
  success?: boolean;
}

export async function toggleTutorStatusAction(
  tutorId: string,
  isActive: boolean
): Promise<SimpleResult> {
  try {
    await assertAdmin();
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  await prisma.user.update({ where: { id: tutorId }, data: { isActive } });
  revalidatePath("/tutors");
  return { success: true };
}

export async function assignCourseToTutorAction(
  tutorId: string,
  courseId: string
): Promise<SimpleResult> {
  try {
    await assertAdmin();
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  await prisma.course.update({ where: { id: courseId }, data: { tutorId } });
  revalidatePath("/tutors");
  revalidatePath("/courses");
  return { success: true };
}
