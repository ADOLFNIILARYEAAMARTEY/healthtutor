import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth/auth", () => ({ auth: authMock, signIn: vi.fn(), signOut: vi.fn(), handlers: {} }));

import { prisma } from "@/lib/db/prisma";
import { createAssessmentAction, saveScoresAction } from "@/app/(dashboard)/assessments/actions";

function asTutor(id: string) {
  authMock.mockResolvedValue({ user: { id, name: "Tutor", email: "tutor@test.com", role: "TUTOR" } });
}

function assessmentForm(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("create assessment and record scores workflow", () => {
  let tutorId: string;
  let courseId: string;
  let studentId: string;

  beforeAll(async () => {
    const tutor = await prisma.user.create({
      data: {
        name: "Assessment Tutor",
        email: "workflow-tutor-assessments@healthtutor.com",
        passwordHash: "unused",
        role: "TUTOR",
      },
    });
    tutorId = tutor.id;

    const course = await prisma.course.create({
      data: { courseCode: "WF-ASM101", courseName: "Assessment Workflow Course", tutorId },
    });
    courseId = course.id;

    const student = await prisma.student.create({
      data: {
        studentNumber: "WF-ASM-001",
        firstName: "Assessment",
        lastName: "Target",
        email: "wf-asm-001@student.healthtutor.com",
      },
    });
    studentId = student.id;

    await prisma.enrollment.create({ data: { studentId, courseId } });
  });

  afterAll(async () => {
    await prisma.score.deleteMany({ where: { assessment: { courseId } } });
    await prisma.assessment.deleteMany({ where: { courseId } });
    await prisma.enrollment.deleteMany({ where: { courseId } });
    await prisma.course.delete({ where: { id: courseId } });
    await prisma.student.delete({ where: { id: studentId } });
    await prisma.user.delete({ where: { id: tutorId } });
  });

  it("creates an assessment with valid maximum score and weight", async () => {
    asTutor(tutorId);
    const result = await createAssessmentAction(
      {},
      assessmentForm({
        courseId,
        title: "Workflow Quiz",
        assessmentType: "Quiz",
        maximumScore: "20",
        weight: "15",
      })
    );

    expect(result.error).toBeUndefined();
    const assessment = await prisma.assessment.findFirst({ where: { courseId } });
    expect(assessment).not.toBeNull();
    expect(assessment?.maximumScore).toBe(20);
  });

  it("rejects a zero or negative maximum score", async () => {
    asTutor(tutorId);
    const result = await createAssessmentAction(
      {},
      assessmentForm({ courseId, title: "Bad", assessmentType: "Quiz", maximumScore: "0", weight: "10" })
    );
    expect(result.fieldErrors?.maximumScore).toBeTruthy();
  });

  it("records a valid score for the enrolled student", async () => {
    asTutor(tutorId);
    const assessment = await prisma.assessment.findFirstOrThrow({ where: { courseId } });

    const result = await saveScoresAction(assessment.id, [{ studentId, score: 18 }]);
    expect(result.success).toBe(true);

    const score = await prisma.score.findUnique({
      where: { assessmentId_studentId: { assessmentId: assessment.id, studentId } },
    });
    expect(score?.score).toBe(18);
  });

  it("allows editing a previously recorded score", async () => {
    asTutor(tutorId);
    const assessment = await prisma.assessment.findFirstOrThrow({ where: { courseId } });

    await saveScoresAction(assessment.id, [{ studentId, score: 12 }]);

    const score = await prisma.score.findUnique({
      where: { assessmentId_studentId: { assessmentId: assessment.id, studentId } },
    });
    expect(score?.score).toBe(12);
  });

  it("rejects a score greater than the assessment's maximum score", async () => {
    asTutor(tutorId);
    const assessment = await prisma.assessment.findFirstOrThrow({ where: { courseId } });

    const result = await saveScoresAction(assessment.id, [{ studentId, score: 999 }]);
    expect(result.error).toBe(`Score cannot exceed the maximum score of ${assessment.maximumScore}.`);

    // The previously saved score must be unchanged.
    const score = await prisma.score.findUnique({
      where: { assessmentId_studentId: { assessmentId: assessment.id, studentId } },
    });
    expect(score?.score).toBe(12);
  });

  it("rejects a negative score", async () => {
    asTutor(tutorId);
    const assessment = await prisma.assessment.findFirstOrThrow({ where: { courseId } });

    const result = await saveScoresAction(assessment.id, [{ studentId, score: -5 }]);
    expect(result.error).toBeTruthy();
  });
});
