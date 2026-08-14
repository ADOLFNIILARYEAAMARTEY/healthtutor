import { prisma } from "@/lib/db/prisma";
import { calculateAttendancePercentage } from "@/lib/calculations/attendance";
import { calculateAcademicAverage } from "@/lib/calculations/academic";
import { classifyRisk } from "@/lib/calculations/risk";

/**
 * Students list with cross-course attendance/academic aggregates and risk.
 * When `tutorId` is provided, scoped to students enrolled in that tutor's
 * courses (tutors only manage/view students connected to their own courses).
 */
export async function listStudentsWithStats(options?: { tutorId?: string }) {
  const students = await prisma.student.findMany({
    where: options?.tutorId
      ? { enrollments: { some: { course: { tutorId: options.tutorId } } } }
      : undefined,
    include: {
      enrollments: true,
      attendance: true,
      scores: { include: { assessment: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return students.map((student) => {
    const totalSessions = student.attendance.length;
    const present = student.attendance.filter((a) => a.status === "PRESENT").length;
    const attendancePercentage = calculateAttendancePercentage(present, totalSessions);

    const academicAverage = calculateAcademicAverage(
      student.scores.map((s) => ({
        score: s.score,
        maximumScore: s.assessment.maximumScore,
        weight: s.assessment.weight,
      }))
    );

    return {
      id: student.id,
      studentNumber: student.studentNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      courseCount: student.enrollments.length,
      attendancePercentage,
      academicAverage,
      risk: classifyRisk(attendancePercentage, academicAverage),
    };
  });
}

export type StudentWithStats = Awaited<ReturnType<typeof listStudentsWithStats>>[number];

/** Full profile: per-course attendance and per-assessment scores, plus overall aggregates. */
export async function getStudentProfile(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      enrollments: {
        include: { course: { include: { tutor: true } } },
      },
      attendance: {
        include: { session: { include: { course: true } } },
      },
      scores: {
        include: { assessment: { include: { course: true } } },
      },
    },
  });

  if (!student) return null;

  const totalSessions = student.attendance.length;
  const present = student.attendance.filter((a) => a.status === "PRESENT").length;
  const overallAttendance = calculateAttendancePercentage(present, totalSessions);

  const overallAcademic = calculateAcademicAverage(
    student.scores.map((s) => ({
      score: s.score,
      maximumScore: s.assessment.maximumScore,
      weight: s.assessment.weight,
    }))
  );

  const risk = classifyRisk(overallAttendance, overallAcademic);

  const attendanceByCourse = student.enrollments.map(({ course }) => {
    const records = student.attendance.filter((a) => a.session.courseId === course.id);
    const coursePresent = records.filter((a) => a.status === "PRESENT").length;
    const courseTotal = records.length;
    return {
      courseId: course.id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      totalSessions: courseTotal,
      present: coursePresent,
      absent: courseTotal - coursePresent,
      attendancePercentage: calculateAttendancePercentage(coursePresent, courseTotal),
    };
  });

  const performanceRows = student.scores.map((s) => ({
    id: s.id,
    courseCode: s.assessment.course.courseCode,
    courseName: s.assessment.course.courseName,
    assessmentTitle: s.assessment.title,
    score: s.score,
    maximumScore: s.assessment.maximumScore,
    percentage: s.assessment.maximumScore > 0 ? (s.score / s.assessment.maximumScore) * 100 : 0,
    weight: s.assessment.weight,
  }));

  return {
    id: student.id,
    studentNumber: student.studentNumber,
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    phone: student.phone,
    gender: student.gender,
    overallAttendance,
    overallAcademic,
    risk,
    courses: student.enrollments.map((e) => ({
      id: e.course.id,
      courseCode: e.course.courseCode,
      courseName: e.course.courseName,
      tutorName: e.course.tutor.name,
    })),
    attendanceByCourse,
    performanceRows,
  };
}

export type StudentProfile = NonNullable<Awaited<ReturnType<typeof getStudentProfile>>>;
