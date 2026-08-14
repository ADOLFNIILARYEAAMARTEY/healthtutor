import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth/auth", () => ({ auth: authMock, signIn: vi.fn(), signOut: vi.fn(), handlers: {} }));

import { prisma } from "@/lib/db/prisma";
import { createSessionAction, saveAttendanceAction } from "@/app/(dashboard)/attendance/actions";

function asTutor(id: string) {
  authMock.mockResolvedValue({ user: { id, name: "Tutor", email: "tutor@test.com", role: "TUTOR" } });
}

function sessionForm(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("record attendance workflow", () => {
  let tutorId: string;
  let courseId: string;
  let studentId: string;

  beforeAll(async () => {
    const tutor = await prisma.user.create({
      data: {
        name: "Attendance Tutor",
        email: "workflow-tutor-attendance@healthtutor.com",
        passwordHash: "unused",
        role: "TUTOR",
      },
    });
    tutorId = tutor.id;

    const course = await prisma.course.create({
      data: { courseCode: "WF-ATT101", courseName: "Attendance Workflow Course", tutorId },
    });
    courseId = course.id;

    const student = await prisma.student.create({
      data: {
        studentNumber: "WF-ATT-001",
        firstName: "Attendance",
        lastName: "Target",
        email: "wf-att-001@student.healthtutor.com",
      },
    });
    studentId = student.id;

    await prisma.enrollment.create({ data: { studentId, courseId } });
  });

  afterAll(async () => {
    await prisma.attendance.deleteMany({ where: { session: { courseId } } });
    await prisma.classSession.deleteMany({ where: { courseId } });
    await prisma.enrollment.deleteMany({ where: { courseId } });
    await prisma.course.delete({ where: { id: courseId } });
    await prisma.student.delete({ where: { id: studentId } });
    await prisma.user.delete({ where: { id: tutorId } });
  });

  it("creates a class session for the tutor's own course", async () => {
    asTutor(tutorId);
    await createSessionAction(
      {},
      sessionForm({ courseId, sessionDate: "2026-08-01", topic: "Workflow Topic" })
    );

    const session = await prisma.classSession.findFirst({ where: { courseId } });
    expect(session).not.toBeNull();
    expect(session?.topic).toBe("Workflow Topic");
  });

  it("saves attendance for the enrolled student", async () => {
    asTutor(tutorId);
    const session = await prisma.classSession.findFirstOrThrow({ where: { courseId } });

    const result = await saveAttendanceAction(session.id, [{ studentId, status: "PRESENT" }]);
    expect(result.success).toBe(true);

    const record = await prisma.attendance.findUnique({
      where: { sessionId_studentId: { sessionId: session.id, studentId } },
    });
    expect(record?.status).toBe("PRESENT");
  });

  it("allows editing previously recorded attendance", async () => {
    asTutor(tutorId);
    const session = await prisma.classSession.findFirstOrThrow({ where: { courseId } });

    await saveAttendanceAction(session.id, [{ studentId, status: "ABSENT" }]);

    const record = await prisma.attendance.findUnique({
      where: { sessionId_studentId: { sessionId: session.id, studentId } },
    });
    expect(record?.status).toBe("ABSENT");

    const allRecords = await prisma.attendance.findMany({ where: { sessionId: session.id, studentId } });
    expect(allRecords).toHaveLength(1);
  });

  it("rejects a tutor recording attendance for a course they do not teach", async () => {
    const otherTutor = await prisma.user.create({
      data: {
        name: "Other Tutor",
        email: "other-tutor-attendance@healthtutor.com",
        passwordHash: "unused",
        role: "TUTOR",
      },
    });
    asTutor(otherTutor.id);

    const session = await prisma.classSession.findFirstOrThrow({ where: { courseId } });
    const result = await saveAttendanceAction(session.id, [{ studentId, status: "PRESENT" }]);

    expect(result.error).toBe("You do not have permission to access this page.");
    await prisma.user.delete({ where: { id: otherTutor.id } });
  });
});
