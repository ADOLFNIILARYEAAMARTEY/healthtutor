"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { classSessionSchema } from "@/lib/validation/courses";
import { saveAttendanceSchema } from "@/lib/validation/attendance";
import { assertAuthenticated, assertCourseAccess, PermissionError } from "@/lib/permissions";

export interface SessionFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof typeof classSessionSchema.shape, string>>;
}

export async function createSessionAction(
  _prevState: SessionFormState,
  formData: FormData
): Promise<SessionFormState> {
  const user = await assertAuthenticated().catch((e) => {
    if (e instanceof PermissionError) return null;
    throw e;
  });
  if (!user) return { error: "You do not have permission to access this page." };

  const parsed = classSessionSchema.safeParse({
    courseId: formData.get("courseId"),
    sessionDate: formData.get("sessionDate"),
    topic: (formData.get("topic") as string)?.trim() || "",
  });

  if (!parsed.success) {
    const fieldErrors: SessionFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof classSessionSchema.shape;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  try {
    await assertCourseAccess(parsed.data.courseId, user);
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  const session = await prisma.classSession.create({
    data: {
      courseId: parsed.data.courseId,
      sessionDate: new Date(parsed.data.sessionDate),
      topic: parsed.data.topic || null,
    },
  });

  revalidatePath("/attendance");
  redirect(`/attendance?course=${parsed.data.courseId}&session=${session.id}`);
}

export interface SaveAttendanceResult {
  error?: string;
  success?: boolean;
}

export async function saveAttendanceAction(
  sessionId: string,
  records: { studentId: string; status: "PRESENT" | "ABSENT" }[]
): Promise<SaveAttendanceResult> {
  const user = await assertAuthenticated().catch((e) => {
    if (e instanceof PermissionError) return null;
    throw e;
  });
  if (!user) return { error: "You do not have permission to access this page." };

  const parsed = saveAttendanceSchema.safeParse({ sessionId, records });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid attendance data." };
  }

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    select: { courseId: true },
  });
  if (!session) return { error: "This class session no longer exists." };

  try {
    await assertCourseAccess(session.courseId, user);
  } catch (error) {
    if (error instanceof PermissionError) return { error: error.message };
    throw error;
  }

  await prisma.$transaction(
    parsed.data.records.map((record) =>
      prisma.attendance.upsert({
        where: { sessionId_studentId: { sessionId, studentId: record.studentId } },
        create: { sessionId, studentId: record.studentId, status: record.status },
        update: { status: record.status },
      })
    )
  );

  revalidatePath("/attendance");
  revalidatePath(`/courses/${session.courseId}`);
  return { success: true };
}
