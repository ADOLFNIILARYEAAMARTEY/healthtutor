import { z } from "zod";

export const attendanceRecordSchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT"]),
});

export const saveAttendanceSchema = z.object({
  sessionId: z.string().min(1),
  records: z.array(attendanceRecordSchema).min(1, "There are no enrolled students to mark."),
});

export type SaveAttendanceInput = z.infer<typeof saveAttendanceSchema>;
