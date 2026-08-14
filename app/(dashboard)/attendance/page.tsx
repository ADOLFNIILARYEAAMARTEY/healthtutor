import type { Metadata } from "next";

import { requireUser } from "@/lib/permissions";
import { listCoursesWithStats } from "@/lib/db/courses";
import { listCourseSessions, getSessionAttendance } from "@/lib/db/attendance";
import { AttendanceToolbar } from "@/components/attendance/attendance-toolbar";
import { AttendanceMarkingForm } from "@/components/attendance/attendance-marking-form";

export const metadata: Metadata = {
  title: "Attendance | HealthTutor",
};

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; session?: string }>;
}) {
  const { course: courseId, session: sessionId } = await searchParams;
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const courses = await listCoursesWithStats(isAdmin ? undefined : { tutorId: user.id });

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          {isAdmin
            ? "No courses have been created yet."
            : "You have no assigned courses yet."}
        </div>
      </div>
    );
  }

  const selectedCourseId = courseId && courses.some((c) => c.id === courseId) ? courseId : undefined;
  const sessions = selectedCourseId ? await listCourseSessions(selectedCourseId) : [];
  const selectedSessionId = sessionId && sessions.some((s) => s.id === sessionId) ? sessionId : undefined;
  const sessionAttendance = selectedSessionId ? await getSessionAttendance(selectedSessionId) : null;

  return (
    <div className="space-y-6">
      <PageHeader />

      <AttendanceToolbar
        courses={courses}
        sessions={sessions}
        selectedCourseId={selectedCourseId}
        selectedSessionId={selectedSessionId}
      />

      {!selectedCourseId ? (
        <EmptyState message="Select a course to view or record attendance." />
      ) : sessions.length === 0 ? (
        <EmptyState message="No class sessions are available for this course. Create one to get started." />
      ) : !sessionAttendance ? (
        <EmptyState message="Select a class session to mark attendance." />
      ) : (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {sessionAttendance.courseCode} — {sessionAttendance.courseName}
            {sessionAttendance.topic ? ` · ${sessionAttendance.topic}` : ""}
          </p>
          <AttendanceMarkingForm session={sessionAttendance} />
        </div>
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
      <p className="mt-1 text-muted-foreground">
        Select a course and session to record or review attendance.
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
