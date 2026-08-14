import type { Metadata } from "next";

import { requireUser } from "@/lib/permissions";
import { listStudentsWithStats } from "@/lib/db/students";
import { StudentsTable } from "@/components/students/students-table";
import { StudentDialog } from "@/components/students/student-dialog";

export const metadata: Metadata = {
  title: "Students | HealthTutor",
};

export default async function StudentsPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const students = await listStudentsWithStats(
    isAdmin ? undefined : { tutorId: user.id }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
          <p className="mt-1 text-muted-foreground">
            {isAdmin
              ? "Manage student records across the institution."
              : "Students enrolled in your assigned courses."}
          </p>
        </div>
        {isAdmin ? <StudentDialog /> : null}
      </div>

      <StudentsTable students={students} canManage={isAdmin} />
    </div>
  );
}
