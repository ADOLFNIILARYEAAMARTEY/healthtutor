export function formatPercentage(value: number | null): string {
  if (value === null) return "No data";
  return `${Math.round(value)}%`;
}

export function formatStudentName(student: { firstName: string; lastName: string }) {
  return `${student.firstName} ${student.lastName}`;
}
