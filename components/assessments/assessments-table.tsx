import Link from "next/link";
import { Trash2 } from "lucide-react";

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
import { AssessmentDialog } from "@/components/assessments/assessment-dialog";
import { deleteAssessmentAction } from "@/app/(dashboard)/assessments/actions";
import type { CourseAssessment } from "@/lib/db/assessments";

export function AssessmentsTable({
  courseId,
  assessments,
  totalStudents,
  weightTotal,
}: {
  courseId: string;
  assessments: CourseAssessment[];
  totalStudents: number;
  weightTotal: number;
}) {
  if (assessments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No assessments have been created for this course yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-center">Maximum Score</TableHead>
            <TableHead className="text-center">Weight</TableHead>
            <TableHead className="text-center">Students Scored</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assessments.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.title}</TableCell>
              <TableCell className="text-muted-foreground">{a.assessmentType}</TableCell>
              <TableCell className="text-center">{a.maximumScore}</TableCell>
              <TableCell className="text-center">{a.weight}%</TableCell>
              <TableCell className="text-center">
                {a.studentsScored} / {totalStudents}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    render={
                      <Link href={`/assessments?course=${courseId}&assessment=${a.id}`}>
                        Enter Scores
                      </Link>
                    }
                  />
                  <AssessmentDialog
                    courseId={courseId}
                    assessment={a}
                    otherWeightsTotal={weightTotal - a.weight}
                  />
                  <ConfirmActionDialog
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label="Delete assessment" title="Delete assessment">
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    }
                    title="Delete assessment?"
                    description={`This permanently deletes "${a.title}" and all recorded scores for it.`}
                    successMessage="Assessment deleted successfully."
                    action={deleteAssessmentAction.bind(null, a.id, courseId)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
