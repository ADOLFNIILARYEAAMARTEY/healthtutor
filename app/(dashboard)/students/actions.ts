"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { studentSchema } from "@/lib/validation/students";
import { assertAdmin, PermissionError } from "@/lib/permissions";

export interface StudentFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof typeof studentSchema.shape, string>>;
  success?: boolean;
}

function normalize(formData: FormData) {
  return {
    studentNumber: (formData.get("studentNumber") as string)?.trim(),
    firstName: (formData.get("firstName") as string)?.trim(),
    lastName: (formData.get("lastName") as string)?.trim(),
    email: (formData.get("email") as string)?.trim(),
    phone: (formData.get("phone") as string)?.trim() || "",
    gender: (formData.get("gender") as string) || "",
  };
}

function fieldErrorsFromZod(error: import("zod").ZodError) {
  const fieldErrors: StudentFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof typeof studentSchema.shape;
    if (key) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function createStudentAction(
  _prevState: StudentFormState,
  formData: FormData
): Promise<StudentFormState> {
  try {
    await assertAdmin();
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  const parsed = studentSchema.safeParse(normalize(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFromZod(parsed.error) };

  try {
    await prisma.student.create({
      data: {
        studentNumber: parsed.data.studentNumber,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        gender: parsed.data.gender || null,
      },
    });
  } catch (error) {
    return { error: mapDbError(error) };
  }

  revalidatePath("/students");
  return { success: true };
}

export async function updateStudentAction(
  studentId: string,
  _prevState: StudentFormState,
  formData: FormData
): Promise<StudentFormState> {
  try {
    await assertAdmin();
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  const parsed = studentSchema.safeParse(normalize(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFromZod(parsed.error) };

  try {
    await prisma.student.update({
      where: { id: studentId },
      data: {
        studentNumber: parsed.data.studentNumber,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        gender: parsed.data.gender || null,
      },
    });
  } catch (error) {
    return { error: mapDbError(error) };
  }

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  return { success: true };
}

export interface DeleteStudentResult {
  error?: string;
  success?: boolean;
}

export async function deleteStudentAction(studentId: string): Promise<DeleteStudentResult> {
  try {
    await assertAdmin();
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  try {
    await prisma.student.delete({ where: { id: studentId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        error:
          "Cannot delete this student because they have existing attendance or score records. Remove those records first.",
      };
    }
    return { error: "Unable to delete student right now. Please try again." };
  }

  revalidatePath("/students");
  return { success: true };
}

function mapDbError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = (error.meta?.target as string[] | undefined)?.join(", ");
    if (target?.includes("studentNumber")) return "Student number already exists.";
    if (target?.includes("email")) return "A student with this email already exists.";
    return "A student with these details already exists.";
  }
  return "Unable to save student right now. Please try again.";
}
