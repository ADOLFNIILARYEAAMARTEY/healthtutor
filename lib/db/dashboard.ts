import { prisma } from "@/lib/db/prisma";
import { getMonitoringRows } from "@/lib/db/monitoring";
import { listStudentsWithStats } from "@/lib/db/students";
import { RISK_SEVERITY } from "@/lib/calculations/risk";

export interface PerformanceDistribution {
  excellent: number; // 80-100
  good: number; // 70-79
  average: number; // 50-69
  belowAverage: number; // below 50
}

export async function getDashboardSummary(options?: { tutorId?: string }) {
  const [rows, students] = await Promise.all([
    getMonitoringRows(options),
    listStudentsWithStats(options),
  ]);

  const attendanceValues = rows
    .map((r) => r.attendancePercentage)
    .filter((v): v is number => v !== null);
  const avgAttendance =
    attendanceValues.length > 0
      ? attendanceValues.reduce((a, b) => a + b, 0) / attendanceValues.length
      : null;

  const academicValues = rows
    .map((r) => r.academicAverage)
    .filter((v): v is number => v !== null);
  const avgAcademicScore =
    academicValues.length > 0
      ? academicValues.reduce((a, b) => a + b, 0) / academicValues.length
      : null;

  const atRiskStudentIds = new Set(
    rows.filter((r) => r.risk !== "GOOD_STANDING").map((r) => r.studentId)
  );

  const distribution: PerformanceDistribution = { excellent: 0, good: 0, average: 0, belowAverage: 0 };
  for (const student of students) {
    if (student.academicAverage === null) continue;
    if (student.academicAverage >= 80) distribution.excellent++;
    else if (student.academicAverage >= 70) distribution.good++;
    else if (student.academicAverage >= 50) distribution.average++;
    else distribution.belowAverage++;
  }

  const atRiskRows = [...rows]
    .filter((r) => r.risk !== "GOOD_STANDING")
    .sort((a, b) => RISK_SEVERITY[b.risk] - RISK_SEVERITY[a.risk]);

  return {
    totalStudents: students.length,
    avgAttendance,
    avgAcademicScore,
    atRiskStudentCount: atRiskStudentIds.size,
    distribution,
    atRiskRows,
  };
}

export async function getAttendanceOverview(options?: { tutorId?: string }) {
  const attendance = await prisma.attendance.findMany({
    where: options?.tutorId ? { session: { course: { tutorId: options.tutorId } } } : undefined,
    select: { status: true },
  });
  const present = attendance.filter((a) => a.status === "PRESENT").length;
  const absent = attendance.length - present;
  return { present, absent };
}
