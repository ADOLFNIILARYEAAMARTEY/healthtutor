import type { Metadata } from "next";

import { requireAdmin } from "@/lib/permissions";
import { listTutorsWithStats } from "@/lib/db/tutors";
import { listCoursesWithStats } from "@/lib/db/courses";
import { TutorsTable } from "@/components/tutors/tutors-table";
import { TutorDialog } from "@/components/tutors/tutor-dialog";

export const metadata: Metadata = {
  title: "Tutors | HealthTutor",
};

export default async function TutorsPage() {
  await requireAdmin();

  const [tutors, courses] = await Promise.all([listTutorsWithStats(), listCoursesWithStats()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tutors</h1>
          <p className="mt-1 text-muted-foreground">
            Manage tutor accounts and course assignments.
          </p>
        </div>
        <TutorDialog />
      </div>

      <TutorsTable tutors={tutors} courses={courses} />
    </div>
  );
}
