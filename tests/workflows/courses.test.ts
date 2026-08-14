import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth/auth", () => ({ auth: authMock, signIn: vi.fn(), signOut: vi.fn(), handlers: {} }));

import { prisma } from "@/lib/db/prisma";
import {
  createCourseAction,
  enrollStudentsAction,
  removeEnrollmentAction,
} from "@/app/(dashboard)/courses/actions";

function asAdmin(id: string) {
  authMock.mockResolvedValue({ user: { id, name: "Admin", email: "admin@test.com", role: "ADMIN" } });
}

function courseForm(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("create course and enrol student workflow", () => {
  let adminId: string;
  let tutorId: string;
  let studentId: string;

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        name: "Workflow Admin",
        email: "workflow-admin-courses@healthtutor.com",
        passwordHash: "unused",
        role: "ADMIN",
      },
    });
    adminId = admin.id;

    const tutor = await prisma.user.create({
      data: {
        name: "Workflow Tutor",
        email: "workflow-tutor-courses@healthtutor.com",
        passwordHash: "unused",
        role: "TUTOR",
      },
    });
    tutorId = tutor.id;

    const student = await prisma.student.create({
      data: {
        studentNumber: "WF-COURSE-001",
        firstName: "Enrol",
        lastName: "Target",
        email: "wf-course-001@student.healthtutor.com",
      },
    });
    studentId = student.id;
  });

  afterAll(async () => {
    await prisma.enrollment.deleteMany({ where: { studentId } });
    await prisma.course.deleteMany({ where: { courseCode: "WF-CS101" } });
    await prisma.student.delete({ where: { id: studentId } });
    await prisma.user.deleteMany({ where: { id: { in: [adminId, tutorId] } } });
  });

  it("creates a course with a valid tutor assignment", async () => {
    asAdmin(adminId);
    const result = await createCourseAction(
      {},
      courseForm({
        courseCode: "WF-CS101",
        courseName: "Workflow Test Course",
        tutorId,
      })
    );

    expect(result.error).toBeUndefined();
    const course = await prisma.course.findUnique({ where: { courseCode: "WF-CS101" } });
    expect(course).not.toBeNull();
    expect(course?.tutorId).toBe(tutorId);
  });

  it("rejects a duplicate course code", async () => {
    asAdmin(adminId);
    const result = await createCourseAction(
      {},
      courseForm({ courseCode: "WF-CS101", courseName: "Duplicate", tutorId })
    );
    expect(result.error).toBe("Course code already exists.");
  });

  it("enrols a student in the course", async () => {
    asAdmin(adminId);
    const course = await prisma.course.findUniqueOrThrow({ where: { courseCode: "WF-CS101" } });

    const result = await enrollStudentsAction(course.id, [studentId]);
    expect(result.success).toBe(true);

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: course.id } },
    });
    expect(enrollment).not.toBeNull();
  });

  it("does not create a duplicate enrollment when enrolling the same student twice", async () => {
    asAdmin(adminId);
    const course = await prisma.course.findUniqueOrThrow({ where: { courseCode: "WF-CS101" } });

    await enrollStudentsAction(course.id, [studentId]);

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId, courseId: course.id },
    });
    expect(enrollments).toHaveLength(1);
  });

  it("removes a student from the course", async () => {
    asAdmin(adminId);
    const course = await prisma.course.findUniqueOrThrow({ where: { courseCode: "WF-CS101" } });

    const result = await removeEnrollmentAction(course.id, studentId);
    expect(result.success).toBe(true);

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: course.id } },
    });
    expect(enrollment).toBeNull();
  });
});
