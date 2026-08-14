import { z } from "zod";

export const studentSchema = z.object({
  studentNumber: z
    .string()
    .min(1, "Student number is required")
    .max(30, "Student number is too long"),
  firstName: z.string().min(1, "First name is required").max(60),
  lastName: z.string().min(1, "Last name is required").max(60),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z
    .string()
    .max(20, "Phone number is too long")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().or(z.literal("")),
});

export type StudentInput = z.infer<typeof studentSchema>;
