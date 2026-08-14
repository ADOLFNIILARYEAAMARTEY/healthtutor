import { prisma } from "@/lib/db/prisma";

export async function listCourseAssessments(courseId: string) {
  const assessments = await prisma.assessment.findMany({
    where: { courseId },
    include: { scores: true },
    orderBy: { createdAt: "asc" },
  });

  return assessments.map((a) => ({
    id: a.id,
    title: a.title,
    assessmentType: a.assessmentType,
    maximumScore: a.maximumScore,
    weight: a.weight,
    studentsScored: a.scores.length,
  }));
}

export type CourseAssessment = Awaited<ReturnType<typeof listCourseAssessments>>[number];

export async function getCourseWeightTotal(courseId: string, excludeAssessmentId?: string) {
  const assessments = await prisma.assessment.findMany({
    where: { courseId, ...(excludeAssessmentId ? { id: { not: excludeAssessmentId } } : {}) },
    select: { weight: true },
  });
  return assessments.reduce((sum, a) => sum + a.weight, 0);
}

export async function getAssessmentScoring(assessmentId: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { course: true, scores: true },
  });
  if (!assessment) return null;

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: assessment.courseId },
    include: { student: true },
    orderBy: [{ student: { lastName: "asc" } }, { student: { firstName: "asc" } }],
  });

  const scoreByStudent = new Map(assessment.scores.map((s) => [s.studentId, s.score]));

  return {
    id: assessment.id,
    courseId: assessment.courseId,
    courseCode: assessment.course.courseCode,
    courseName: assessment.course.courseName,
    title: assessment.title,
    assessmentType: assessment.assessmentType,
    maximumScore: assessment.maximumScore,
    weight: assessment.weight,
    students: enrollments.map(({ student }) => ({
      studentId: student.id,
      studentNumber: student.studentNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      score: scoreByStudent.get(student.id) ?? null,
    })),
  };
}

export type AssessmentScoring = NonNullable<Awaited<ReturnType<typeof getAssessmentScoring>>>;
