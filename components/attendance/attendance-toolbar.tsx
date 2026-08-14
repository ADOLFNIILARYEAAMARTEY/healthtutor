"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateSessionDialog } from "@/components/attendance/create-session-dialog";

interface CourseOption {
  id: string;
  courseCode: string;
  courseName: string;
}

interface SessionOption {
  id: string;
  sessionDate: Date;
  topic: string | null;
  marked: number;
}

export function AttendanceToolbar({
  courses,
  sessions,
  selectedCourseId,
  selectedSessionId,
}: {
  courses: CourseOption[];
  sessions: SessionOption[];
  selectedCourseId?: string;
  selectedSessionId?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={selectedCourseId}
          onValueChange={(value) => router.push(`/attendance?course=${value}`)}
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

        {selectedCourseId ? (
          <Select
            value={selectedSessionId}
            onValueChange={(value) =>
              router.push(`/attendance?course=${selectedCourseId}&session=${value}`)
            }
          >
            <SelectTrigger className="w-full sm:w-64" aria-label="Select class session">
              <SelectValue placeholder="Select a session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {format(s.sessionDate, "PPP")}
                  {s.topic ? ` — ${s.topic}` : ""}
                  {s.marked > 0 ? " (recorded)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {selectedCourseId ? <CreateSessionDialog courseId={selectedCourseId} /> : null}
    </div>
  );
}
