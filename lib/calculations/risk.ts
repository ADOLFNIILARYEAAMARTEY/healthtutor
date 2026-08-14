export const DEFAULT_ATTENDANCE_THRESHOLD = 75;
export const DEFAULT_ACADEMIC_THRESHOLD = 50;

export type RiskStatus =
  | "HIGH_RISK"
  | "ATTENDANCE_RISK"
  | "ACADEMIC_RISK"
  | "GOOD_STANDING";

export const RISK_LABELS: Record<RiskStatus, string> = {
  HIGH_RISK: "High Risk",
  ATTENDANCE_RISK: "Attendance Risk",
  ACADEMIC_RISK: "Academic Risk",
  GOOD_STANDING: "Good Standing",
};

export interface RiskThresholds {
  attendance?: number;
  academic?: number;
}

/** Higher = more severe. Used to rank/sort by risk and to pick a single
 * "worst" status when a student's risk varies across courses. */
export const RISK_SEVERITY: Record<RiskStatus, number> = {
  HIGH_RISK: 3,
  ATTENDANCE_RISK: 2,
  ACADEMIC_RISK: 2,
  GOOD_STANDING: 0,
};

/**
 * Risk Classification (default thresholds: attendance 75%, academic 50%):
 *   attendance < threshold AND academic < threshold -> HIGH_RISK
 *   attendance < threshold only                     -> ATTENDANCE_RISK
 *   academic < threshold only                        -> ACADEMIC_RISK
 *   otherwise                                         -> GOOD_STANDING
 *
 * A dimension with no data yet (null) is treated as not-at-risk for that
 * dimension, so a newly enrolled student isn't flagged before any sessions
 * or assessments have happened.
 */
export function classifyRisk(
  attendancePercentage: number | null,
  academicAverage: number | null,
  thresholds: RiskThresholds = {}
): RiskStatus {
  const attendanceThreshold =
    thresholds.attendance ?? DEFAULT_ATTENDANCE_THRESHOLD;
  const academicThreshold = thresholds.academic ?? DEFAULT_ACADEMIC_THRESHOLD;

  const isAttendanceRisk =
    attendancePercentage !== null && attendancePercentage < attendanceThreshold;
  const isAcademicRisk =
    academicAverage !== null && academicAverage < academicThreshold;

  if (isAttendanceRisk && isAcademicRisk) return "HIGH_RISK";
  if (isAttendanceRisk) return "ATTENDANCE_RISK";
  if (isAcademicRisk) return "ACADEMIC_RISK";
  return "GOOD_STANDING";
}
