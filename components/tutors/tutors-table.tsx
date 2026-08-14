import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/dashboard/confirm-action-dialog";
import { TutorDialog } from "@/components/tutors/tutor-dialog";
import { AssignCourseDialog } from "@/components/tutors/assign-course-dialog";
import { EnableTutorButton } from "@/components/tutors/toggle-status-button";
import { toggleTutorStatusAction } from "@/app/(dashboard)/tutors/actions";
import type { TutorWithStats } from "@/lib/db/tutors";

interface CourseOption {
  id: string;
  courseCode: string;
  courseName: string;
  tutorName: string;
}

export function TutorsTable({
  tutors,
  courses,
}: {
  tutors: TutorWithStats[];
  courses: CourseOption[];
}) {
  if (tutors.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No tutors have been created yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tutor Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-center">Courses</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tutors.map((tutor) => (
            <TableRow key={tutor.id}>
              <TableCell className="font-medium">{tutor.name}</TableCell>
              <TableCell className="text-muted-foreground">{tutor.email}</TableCell>
              <TableCell className="text-center">{tutor.courseCount}</TableCell>
              <TableCell>
                <span
                  className={
                    tutor.isActive
                      ? "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                  }
                >
                  {tutor.isActive ? "Active" : "Disabled"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <AssignCourseDialog tutorId={tutor.id} tutorName={tutor.name} courses={courses} />
                  <TutorDialog tutor={tutor} />
                  {tutor.isActive ? (
                    <ConfirmActionDialog
                      trigger={
                        <Button variant="outline" size="sm">
                          Disable
                        </Button>
                      }
                      title="Disable this tutor?"
                      description={`${tutor.name} will no longer be able to log in. Their courses and historical records are kept.`}
                      confirmLabel="Disable"
                      successMessage="Tutor disabled successfully."
                      action={toggleTutorStatusAction.bind(null, tutor.id, false)}
                    />
                  ) : (
                    <EnableTutorButton tutorId={tutor.id} />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
