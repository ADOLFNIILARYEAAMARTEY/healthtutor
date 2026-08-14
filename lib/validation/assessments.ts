import { z } from "zod";

export const assessmentSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  title: z.string().min(1, "Title is required").max(120),
  assessmentType: z.string().min(1, "Assessment type is required"),
  maximumScore: z.coerce.number().positive("Maximum score must be greater than zero"),
  weight: z.coerce.number().positive("Weight must be greater than zero"),
});

export type AssessmentInput = z.infer<typeof assessmentSchema>;

export const ASSESSMENT_TYPES = [
  "Quiz",
  "Assignment",
  "Mid-Semester",
  "Project",
  "Examination",
] as const;

export const scoreEntrySchema = z.object({
  studentId: z.string().min(1),
  score: z.coerce.number().min(0, "Score cannot be negative"),
});

export const saveScoresSchema = z.object({
  assessmentId: z.string().min(1),
  entries: z.array(scoreEntrySchema),
});

/** score >= 0 and score <= the assessment's maximum score. */
export function isScoreWithinRange(score: number, maximumScore: number): boolean {
  return score >= 0 && score <= maximumScore;
}
