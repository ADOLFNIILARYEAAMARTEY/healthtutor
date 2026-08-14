/**
 * Attendance Percentage = Number of Sessions Present / Total Number of Sessions × 100
 * Returns null when there is no attendance data yet, rather than dividing by zero.
 */
export function calculateAttendancePercentage(
  present: number,
  total: number
): number | null {
  if (total <= 0) return null;
  return (present / total) * 100;
}
