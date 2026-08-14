import { prisma } from "@/lib/db/prisma";
import { calculateAttendancePercentage } from "@/lib/calculations/attendance";
import { calculateAcademicAverage } from "@/lib/calculations/academic";
import { classifyRisk, RISK_SEVERITY, type RiskStatus } from "@/lib/calculations/risk";

/**
 * One row per (student, course) enrollment — the granularity the Academic
 * Monitoring page and dashboard "at risk" table operate at, since risk is
 * inherently course-specific (a student can be at risk in one course and
 * fine in another).
 */
export async function getMonitoringRows(options?: { tutorId?: string }) {
  const courses = await prisma.course.findMany({
    where: options?.tutorId ? { tutorId: options.tutorId } : undefined,
    include: {
      enrollments: { include: { student: true } },
      sessions: { include: { attendance: true } },
      assessments: { include: { scores: true } },
    },
  });

  const rows = [];
  for (const course of courses) {
    for (const enrollment of course.enrollments) {
      const student = enrollment.student;

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

      rows.push({
        studentId: student.id,
        studentNumber: student.studentNumber,
        studentName: `${student.firstName} ${student.lastName}`,
        courseId: course.id,
        courseCode: course.courseCode,
        courseName: course.courseName,
        attendancePercentage,
        academicAverage,
        risk: classifyRisk(attendancePercentage, academicAverage),
      });
    }
  }

  return rows;
}

export type MonitoringRow = Awaited<ReturnType<typeof getMonitoringRows>>[number];

/**
 * Collapses per-course rows to one entry per student, keeping that
 * student's most severe risk status. Used for summary counts where each
 * student should be counted exactly once, even if their risk varies
 * across the courses they're enrolled in.
 */
export function summarizeWorstRiskByStudent(rows: MonitoringRow[]) {
  const worst = new Map<string, RiskStatus>();
  for (const row of rows) {
    const current = worst.get(row.studentId);
    if (!current || RISK_SEVERITY[row.risk] > RISK_SEVERITY[current]) {
      worst.set(row.studentId, row.risk);
    }
  }
  return worst;
}
