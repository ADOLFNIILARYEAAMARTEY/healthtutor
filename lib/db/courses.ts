import { prisma } from "@/lib/db/prisma";
import { calculateAttendancePercentage } from "@/lib/calculations/attendance";
import { calculateAcademicAverage } from "@/lib/calculations/academic";
import { classifyRisk } from "@/lib/calculations/risk";

export async function listCoursesWithStats(options?: { tutorId?: string }) {
  const courses = await prisma.course.findMany({
    where: options?.tutorId ? { tutorId: options.tutorId } : undefined,
    include: {
      tutor: true,
      enrollments: true,
      sessions: { include: { attendance: true } },
    },
    orderBy: { courseCode: "asc" },
  });

  return courses.map((course) => {
    const allAttendance = course.sessions.flatMap((s) => s.attendance);
    const present = allAttendance.filter((a) => a.status === "PRESENT").length;

    return {
      id: course.id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      description: course.description,
      tutorId: course.tutorId,
      tutorName: course.tutor.name,
      studentCount: course.enrollments.length,
      sessionCount: course.sessions.length,
      avgAttendance: calculateAttendancePercentage(present, allAttendance.length),
    };
  });
}

export type CourseWithStats = Awaited<ReturnType<typeof listCoursesWithStats>>[number];

export async function getCourseDetail(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      tutor: true,
      enrollments: { include: { student: true }, orderBy: { student: { lastName: "asc" } } },
      sessions: { include: { attendance: true }, orderBy: { sessionDate: "desc" } },
      assessments: { include: { scores: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!course) return null;

  const studentRows = course.enrollments.map(({ student }) => {
    const attendanceRecords = course.sessions.flatMap((s) =>
      s.attendance.filter((a) => a.studentId === student.id)
    );
    const present = attendanceRecords.filter((a) => a.status === "PRESENT").length;
    const attendancePercentage = calculateAttendancePercentage(present, attendanceRecords.length);

    const scores = course.assessments.flatMap((a) =>
      a.scores
        .filter((sc) => sc.studentId === student.id)
        .map((sc) => ({ score: sc.score, maximumScore: a.maximumScore, weight: a.weight }))
    );
    const academicAverage = calculateAcademicAverage(scores);

    return {
      studentId: student.id,
      studentNumber: student.studentNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      attendancePercentage,
      academicAverage,
      risk: classifyRisk(attendancePercentage, academicAverage),
    };
  });

  const allAttendance = course.sessions.flatMap((s) => s.attendance);
  const present = allAttendance.filter((a) => a.status === "PRESENT").length;
  const avgAttendance = calculateAttendancePercentage(present, allAttendance.length);

  const academicValues = studentRows
    .map((r) => r.academicAverage)
    .filter((v): v is number => v !== null);
  const avgScore =
    academicValues.length > 0
      ? academicValues.reduce((a, b) => a + b, 0) / academicValues.length
      : null;

  const atRiskCount = studentRows.filter((r) => r.risk !== "GOOD_STANDING").length;

  return {
    id: course.id,
    courseCode: course.courseCode,
    courseName: course.courseName,
    description: course.description,
    tutorId: course.tutorId,
    tutorName: course.tutor.name,
    totalStudents: course.enrollments.length,
    totalSessions: course.sessions.length,
    avgAttendance,
    avgScore,
    atRiskCount,
    students: studentRows,
    sessions: course.sessions.map((s) => ({
      id: s.id,
      sessionDate: s.sessionDate,
      topic: s.topic,
      present: s.attendance.filter((a) => a.status === "PRESENT").length,
      absent: s.attendance.filter((a) => a.status === "ABSENT").length,
      marked: s.attendance.length,
    })),
    assessments: course.assessments.map((a) => ({
      id: a.id,
      title: a.title,
      assessmentType: a.assessmentType,
      maximumScore: a.maximumScore,
      weight: a.weight,
      studentsScored: a.scores.length,
    })),
  };
}

export type CourseDetail = NonNullable<Awaited<ReturnType<typeof getCourseDetail>>>;

export async function listUnenrolledStudents(courseId: string) {
  return prisma.student.findMany({
    where: { enrollments: { none: { courseId } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function listTutors() {
  return prisma.user.findMany({
    where: { role: "TUTOR" },
    orderBy: { name: "asc" },
  });
}
