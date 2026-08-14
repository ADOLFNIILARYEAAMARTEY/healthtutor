import type { Metadata } from "next";

import { requireUser } from "@/lib/permissions";
import { listCoursesWithStats } from "@/lib/db/courses";
import { listCourseAssessments, getAssessmentScoring, getCourseWeightTotal } from "@/lib/db/assessments";
import { AssessmentsToolbar } from "@/components/assessments/assessments-toolbar";
import { AssessmentsTable } from "@/components/assessments/assessments-table";
import { AssessmentDialog } from "@/components/assessments/assessment-dialog";
import { ScoreEntryForm } from "@/components/assessments/score-entry-form";

export const metadata: Metadata = {
  title: "Assessments | HealthTutor",
};

export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; assessment?: string }>;
}) {
  const { course: courseId, assessment: assessmentId } = await searchParams;
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const courses = await listCoursesWithStats(isAdmin ? undefined : { tutorId: user.id });

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <EmptyState
          message={isAdmin ? "No courses have been created yet." : "You have no assigned courses yet."}
        />
      </div>
    );
  }

  const selectedCourseId = courseId && courses.some((c) => c.id === courseId) ? courseId : undefined;

  const [assessments, weightTotal] = selectedCourseId
    ? await Promise.all([
        listCourseAssessments(selectedCourseId),
        getCourseWeightTotal(selectedCourseId),
      ])
    : [[], 0];

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedAssessmentId =
    assessmentId && assessments.some((a) => a.id === assessmentId) ? assessmentId : undefined;
  const scoring = selectedAssessmentId ? await getAssessmentScoring(selectedAssessmentId) : null;

  return (
    <div className="space-y-6">
      <PageHeader />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AssessmentsToolbar courses={courses} selectedCourseId={selectedCourseId} />
        {selectedCourseId ? (
          <AssessmentDialog courseId={selectedCourseId} otherWeightsTotal={weightTotal} />
        ) : null}
      </div>

      {!selectedCourseId ? (
        <EmptyState message="Select a course to view its assessments." />
      ) : scoring ? (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {scoring.courseCode} — {scoring.courseName} · {scoring.title} ({scoring.assessmentType})
          </p>
          <ScoreEntryForm assessment={scoring} />
        </div>
      ) : (
        <AssessmentsTable
          courseId={selectedCourseId}
          assessments={assessments}
          totalStudents={selectedCourse?.studentCount ?? 0}
          weightTotal={weightTotal}
        />
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Assessments</h1>
      <p className="mt-1 text-muted-foreground">
        Create assessments and record student scores for each course.
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
