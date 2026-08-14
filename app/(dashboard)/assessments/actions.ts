"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { assessmentSchema, saveScoresSchema, isScoreWithinRange } from "@/lib/validation/assessments";
import { assertAuthenticated, assertCourseAccess, PermissionError } from "@/lib/permissions";

export interface AssessmentFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof typeof assessmentSchema.shape, string>>;
  success?: boolean;
}

function normalize(formData: FormData) {
  return {
    courseId: (formData.get("courseId") as string)?.trim(),
    title: (formData.get("title") as string)?.trim(),
    assessmentType: (formData.get("assessmentType") as string)?.trim(),
    maximumScore: formData.get("maximumScore"),
    weight: formData.get("weight"),
  };
}

function fieldErrorsFromZod(error: import("zod").ZodError) {
  const fieldErrors: AssessmentFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof typeof assessmentSchema.shape;
    if (key) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function createAssessmentAction(
  _prevState: AssessmentFormState,
  formData: FormData
): Promise<AssessmentFormState> {
  const user = await assertAuthenticated().catch((e) => {
    if (e instanceof PermissionError) return null;
    throw e;
  });
  if (!user) return { error: "You do not have permission to access this page." };

  const parsed = assessmentSchema.safeParse(normalize(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFromZod(parsed.error) };

  try {
    await assertCourseAccess(parsed.data.courseId, user);
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  await prisma.assessment.create({ data: parsed.data });

  revalidatePath("/assessments");
  revalidatePath(`/courses/${parsed.data.courseId}`);
  return { success: true };
}

export async function updateAssessmentAction(
  assessmentId: string,
  _prevState: AssessmentFormState,
  formData: FormData
): Promise<AssessmentFormState> {
  const user = await assertAuthenticated().catch((e) => {
    if (e instanceof PermissionError) return null;
    throw e;
  });
  if (!user) return { error: "You do not have permission to access this page." };

  const parsed = assessmentSchema.safeParse(normalize(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFromZod(parsed.error) };

  try {
    await assertCourseAccess(parsed.data.courseId, user);
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  await prisma.assessment.update({ where: { id: assessmentId }, data: parsed.data });

  revalidatePath("/assessments");
  revalidatePath(`/courses/${parsed.data.courseId}`);
  return { success: true };
}

export interface SimpleResult {
  error?: string;
  success?: boolean;
}

export async function deleteAssessmentAction(
  assessmentId: string,
  courseId: string
): Promise<SimpleResult> {
  const user = await assertAuthenticated().catch((e) => {
    if (e instanceof PermissionError) return null;
    throw e;
  });
  if (!user) return { error: "You do not have permission to access this page." };

  try {
    await assertCourseAccess(courseId, user);
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  await prisma.assessment.delete({ where: { id: assessmentId } });

  revalidatePath("/assessments");
  revalidatePath(`/courses/${courseId}`);
  return { success: true };
}

export interface SaveScoresResult {
  error?: string;
  success?: boolean;
}

export async function saveScoresAction(
  assessmentId: string,
  entries: { studentId: string; score: number }[]
): Promise<SaveScoresResult> {
  const user = await assertAuthenticated().catch((e) => {
    if (e instanceof PermissionError) return null;
    throw e;
  });
  if (!user) return { error: "You do not have permission to access this page." };

  const parsed = saveScoresSchema.safeParse({ assessmentId, entries });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid score data." };
  }

  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) return { error: "This assessment no longer exists." };

  try {
    await assertCourseAccess(assessment.courseId, user);
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  const invalid = parsed.data.entries.find(
    (e) => !isScoreWithinRange(e.score, assessment.maximumScore)
  );
  if (invalid) {
    return { error: `Score cannot exceed the maximum score of ${assessment.maximumScore}.` };
  }

  try {
    await prisma.$transaction(
      parsed.data.entries.map((entry) =>
        prisma.score.upsert({
          where: { assessmentId_studentId: { assessmentId, studentId: entry.studentId } },
          create: { assessmentId, studentId: entry.studentId, score: entry.score },
          update: { score: entry.score },
        })
      )
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { error: "Unable to save scores right now. Please try again." };
    }
    throw error;
  }

  revalidatePath("/assessments");
  revalidatePath(`/courses/${assessment.courseId}`);
  return { success: true };
}
