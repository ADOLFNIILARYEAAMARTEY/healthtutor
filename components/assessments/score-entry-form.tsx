"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPercentage } from "@/lib/format";
import { saveScoresAction } from "@/app/(dashboard)/assessments/actions";
import type { AssessmentScoring } from "@/lib/db/assessments";

export function ScoreEntryForm({ assessment }: { assessment: AssessmentScoring }) {
  const [scores, setScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      assessment.students.map((s) => [s.studentId, s.score !== null ? String(s.score) : ""])
    )
  );
  const [isPending, startTransition] = useTransition();

  const errors = useMemo(() => {
    const map: Record<string, string> = {};
    for (const student of assessment.students) {
      const raw = scores[student.studentId];
      if (raw === "" || raw === undefined) continue;
      const value = Number(raw);
      if (Number.isNaN(value)) {
        map[student.studentId] = "Enter a number";
      } else if (value < 0) {
        map[student.studentId] = "Cannot be negative";
      } else if (value > assessment.maximumScore) {
        map[student.studentId] = `Max is ${assessment.maximumScore}`;
      }
    }
    return map;
  }, [scores, assessment.students, assessment.maximumScore]);

  const hasErrors = Object.keys(errors).length > 0;

  function handleSave() {
    if (hasErrors) {
      toast.error("Fix the highlighted scores before saving.");
      return;
    }
    const entries = assessment.students
      .filter((s) => scores[s.studentId] !== "" && scores[s.studentId] !== undefined)
      .map((s) => ({ studentId: s.studentId, score: Number(scores[s.studentId]) }));

    startTransition(async () => {
      const result = await saveScoresAction(assessment.id, entries);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Scores updated successfully.");
    });
  }

  if (assessment.students.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No students are enrolled in this course yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Number</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead className="w-32">Score</TableHead>
              <TableHead className="text-center">Maximum</TableHead>
              <TableHead>Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessment.students.map((student) => {
              const raw = scores[student.studentId] ?? "";
              const numeric = raw === "" ? null : Number(raw);
              const percentage =
                numeric !== null && !Number.isNaN(numeric)
                  ? (numeric / assessment.maximumScore) * 100
                  : null;
              const error = errors[student.studentId];

              return (
                <TableRow key={student.studentId}>
                  <TableCell className="font-medium">{student.studentNumber}</TableCell>
                  <TableCell>
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={assessment.maximumScore}
                      step="0.01"
                      inputMode="decimal"
                      value={raw}
                      aria-invalid={!!error}
                      aria-label={`Score for ${student.firstName} ${student.lastName}`}
                      onChange={(e) =>
                        setScores((prev) => ({ ...prev, [student.studentId]: e.target.value }))
                      }
                      className="h-8 w-24"
                    />
                    {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {assessment.maximumScore}
                  </TableCell>
                  <TableCell>{percentage !== null ? formatPercentage(percentage) : "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending || hasErrors}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Save Scores
        </Button>
      </div>
    </div>
  );
}
