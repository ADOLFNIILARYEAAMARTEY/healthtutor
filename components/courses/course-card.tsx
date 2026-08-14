import Link from "next/link";
import { BookOpen, CalendarCheck, Trash2, Users } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/dashboard/confirm-action-dialog";
import { CourseDialog } from "@/components/courses/course-dialog";
import { deleteCourseAction } from "@/app/(dashboard)/courses/actions";
import { formatPercentage } from "@/lib/format";
import type { CourseWithStats } from "@/lib/db/courses";

export function CourseCard({
  course,
  tutors,
  canManage,
}: {
  course: CourseWithStats;
  tutors: { id: string; name: string }[];
  canManage: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{course.courseCode}</p>
          <CardTitle className="text-lg">
            <Link href={`/courses/${course.id}`} className="hover:underline">
              {course.courseName}
            </Link>
          </CardTitle>
        </div>
        {canManage ? (
          <div className="flex shrink-0 gap-1">
            <CourseDialog course={course} tutors={tutors} />
            <ConfirmActionDialog
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label="Delete course" title="Delete course">
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              }
              title="Delete course?"
              description={`This permanently deletes ${course.courseCode} — ${course.courseName}. Courses with existing sessions or assessments cannot be deleted.`}
              successMessage="Course deleted successfully."
              action={deleteCourseAction.bind(null, course.id)}
            />
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Tutor: {course.tutorName}</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md border p-2">
            <Users className="mx-auto size-4 text-muted-foreground" />
            <p className="mt-1 text-sm font-semibold">{course.studentCount}</p>
            <p className="text-xs text-muted-foreground">Students</p>
          </div>
          <div className="rounded-md border p-2">
            <BookOpen className="mx-auto size-4 text-muted-foreground" />
            <p className="mt-1 text-sm font-semibold">{course.sessionCount}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
          <div className="rounded-md border p-2">
            <CalendarCheck className="mx-auto size-4 text-muted-foreground" />
            <p className="mt-1 text-sm font-semibold">{formatPercentage(course.avgAttendance)}</p>
            <p className="text-xs text-muted-foreground">Attendance</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" render={<Link href={`/courses/${course.id}`}>View Course</Link>} />
      </CardFooter>
    </Card>
  );
}
