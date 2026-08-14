import { prisma } from "@/lib/db/prisma";

export async function listCourseSessions(courseId: string) {
  const sessions = await prisma.classSession.findMany({
    where: { courseId },
    include: { attendance: true },
    orderBy: { sessionDate: "desc" },
  });

  return sessions.map((s) => ({
    id: s.id,
    sessionDate: s.sessionDate,
    topic: s.topic,
    present: s.attendance.filter((a) => a.status === "PRESENT").length,
    marked: s.attendance.length,
  }));
}

export async function getSessionAttendance(sessionId: string) {
  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: {
      course: true,
      attendance: true,
    },
  });
  if (!session) return null;

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: session.courseId },
    include: { student: true },
    orderBy: [{ student: { lastName: "asc" } }, { student: { firstName: "asc" } }],
  });

  const statusByStudent = new Map(session.attendance.map((a) => [a.studentId, a.status]));

  return {
    id: session.id,
    courseId: session.courseId,
    courseCode: session.course.courseCode,
    courseName: session.course.courseName,
    sessionDate: session.sessionDate,
    topic: session.topic,
    students: enrollments.map(({ student }) => ({
      studentId: student.id,
      studentNumber: student.studentNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      status: statusByStudent.get(student.id) ?? null,
    })),
  };
}

export type SessionAttendance = NonNullable<Awaited<ReturnType<typeof getSessionAttendance>>>;
