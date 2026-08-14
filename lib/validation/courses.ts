import { z } from "zod";

export const courseSchema = z.object({
  courseCode: z.string().min(1, "Course code is required").max(20, "Course code is too long"),
  courseName: z.string().min(1, "Course name is required").max(120),
  description: z.string().max(500, "Description is too long").optional().or(z.literal("")),
  tutorId: z.string().min(1, "A tutor must be assigned to this course"),
});

export type CourseInput = z.infer<typeof courseSchema>;

export const classSessionSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  sessionDate: z.string().min(1, "Date is required"),
  topic: z.string().max(200, "Topic is too long").optional().or(z.literal("")),
});

export type ClassSessionInput = z.infer<typeof classSessionSchema>;
