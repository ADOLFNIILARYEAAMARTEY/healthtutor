"use client";

import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CourseOption {
  id: string;
  courseCode: string;
  courseName: string;
}

export function AssessmentsToolbar({
  courses,
  selectedCourseId,
}: {
  courses: CourseOption[];
  selectedCourseId?: string;
}) {
  const router = useRouter();

  return (
    <Select
      value={selectedCourseId}
      onValueChange={(value) => router.push(`/assessments?course=${value}`)}
    >
      <SelectTrigger className="w-full sm:w-64" aria-label="Select course">
        <SelectValue placeholder="Select a course" />
      </SelectTrigger>
      <SelectContent>
        {courses.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.courseCode} — {c.courseName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
