"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { courseSchema } from "@/lib/validation/courses";
import { assertAdmin, PermissionError } from "@/lib/permissions";

export interface CourseFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof typeof courseSchema.shape, string>>;
  success?: boolean;
}

function normalize(formData: FormData) {
  return {
    courseCode: (formData.get("courseCode") as string)?.trim(),
    courseName: (formData.get("courseName") as string)?.trim(),
    description: (formData.get("description") as string)?.trim() || "",
    tutorId: (formData.get("tutorId") as string)?.trim(),
  };
}

function fieldErrorsFromZod(error: import("zod").ZodError) {
  const fieldErrors: CourseFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof typeof courseSchema.shape;
    if (key) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function createCourseAction(
  _prevState: CourseFormState,
  formData: FormData
): Promise<CourseFormState> {
  try {
    await assertAdmin();
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  const parsed = courseSchema.safeParse(normalize(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFromZod(parsed.error) };

  try {
    await prisma.course.create({
      data: {
        courseCode: parsed.data.courseCode,
        courseName: parsed.data.courseName,
        description: parsed.data.description || null,
        tutorId: parsed.data.tutorId,
      },
    });
  } catch (error) {
    return { error: mapDbError(error) };
  }

  revalidatePath("/courses");
  return { success: true };
}

export async function updateCourseAction(
  courseId: string,
  _prevState: CourseFormState,
  formData: FormData
): Promise<CourseFormState> {
  try {
    await assertAdmin();
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  const parsed = courseSchema.safeParse(normalize(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFromZod(parsed.error) };

  try {
    await prisma.course.update({
      where: { id: courseId },
      data: {
        courseCode: parsed.data.courseCode,
        courseName: parsed.data.courseName,
        description: parsed.data.description || null,
        tutorId: parsed.data.tutorId,
      },
    });
  } catch (error) {
    return { error: mapDbError(error) };
  }

  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  return { success: true };
}

export interface SimpleResult {
  error?: string;
  success?: boolean;
}

export async function deleteCourseAction(courseId: string): Promise<SimpleResult> {
  try {
    await assertAdmin();
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  try {
    await prisma.course.delete({ where: { id: courseId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        error:
          "Cannot delete this course because it has class sessions or assessments. Remove those first.",
      };
    }
    return { error: "Unable to delete course right now. Please try again." };
  }

  revalidatePath("/courses");
  return { success: true };
}

export async function enrollStudentsAction(
  courseId: string,
  studentIds: string[]
): Promise<SimpleResult> {
  try {
    await assertAdmin();
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  if (studentIds.length === 0) {
    return { error: "Select at least one student to enroll." };
  }

  await prisma.enrollment.createMany({
    data: studentIds.map((studentId) => ({ studentId, courseId })),
    skipDuplicates: true,
  });

  revalidatePath(`/courses/${courseId}`);
  return { success: true };
}

export async function removeEnrollmentAction(
  courseId: string,
  studentId: string
): Promise<SimpleResult> {
  try {
    await assertAdmin();
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  await prisma.enrollment.deleteMany({ where: { courseId, studentId } });

  revalidatePath(`/courses/${courseId}`);
  return { success: true };
}

function mapDbError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return "Course code already exists.";
  }
  return "Unable to save course right now. Please try again.";
}
