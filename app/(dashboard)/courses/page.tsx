import type { Metadata } from "next";

import { requireUser } from "@/lib/permissions";
import { listCoursesWithStats, listTutors } from "@/lib/db/courses";
import { CourseCard } from "@/components/courses/course-card";
import { CourseDialog } from "@/components/courses/course-dialog";

export const metadata: Metadata = {
  title: "Courses | HealthTutor",
};

export default async function CoursesPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const [courses, tutors] = await Promise.all([
    listCoursesWithStats(isAdmin ? undefined : { tutorId: user.id }),
    isAdmin ? listTutors() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
          <p className="mt-1 text-muted-foreground">
            {isAdmin ? "All courses across the institution." : "Courses assigned to you."}
          </p>
        </div>
        {isAdmin ? <CourseDialog tutors={tutors} /> : null}
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No courses have been created yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} tutors={tutors} canManage={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}
