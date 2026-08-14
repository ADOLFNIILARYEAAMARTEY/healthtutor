"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { saveAttendanceAction } from "@/app/(dashboard)/attendance/actions";
import type { SessionAttendance } from "@/lib/db/attendance";

type Status = "PRESENT" | "ABSENT";

export function AttendanceMarkingForm({ session }: { session: SessionAttendance }) {
  const [statuses, setStatuses] = useState<Record<string, Status>>(() =>
    Object.fromEntries(session.students.map((s) => [s.studentId, s.status ?? "ABSENT"]))
  );
  const [isPending, startTransition] = useTransition();

  const { presentCount, absentCount } = useMemo(() => {
    const values = Object.values(statuses);
    return {
      presentCount: values.filter((v) => v === "PRESENT").length,
      absentCount: values.filter((v) => v === "ABSENT").length,
    };
  }, [statuses]);

  function setStatus(studentId: string, status: Status) {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  }

  function markAllPresent() {
    setStatuses(Object.fromEntries(session.students.map((s) => [s.studentId, "PRESENT"])));
  }

  function handleSave() {
    startTransition(async () => {
      const records = session.students.map((s) => ({
        studentId: s.studentId,
        status: statuses[s.studentId],
      }));
      const result = await saveAttendanceAction(session.id, records);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Attendance saved successfully.");
    });
  }

  if (session.students.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No students are enrolled in this course yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={markAllPresent} type="button">
          Mark All Present
        </Button>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Present: <span className="font-semibold text-foreground">{presentCount}</span>
          </span>
          <span className="text-muted-foreground">
            Absent: <span className="font-semibold text-foreground">{absentCount}</span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Number</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead className="text-center">Present</TableHead>
              <TableHead className="text-center">Absent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {session.students.map((student) => {
              const status = statuses[student.studentId];
              return (
                <TableRow key={student.studentId}>
                  <TableCell className="font-medium">{student.studentNumber}</TableCell>
                  <TableCell>
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      aria-pressed={status === "PRESENT"}
                      aria-label={`Mark ${student.firstName} ${student.lastName} present`}
                      onClick={() => setStatus(student.studentId, "PRESENT")}
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-md border transition-colors",
                        status === "PRESENT"
                          ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <Check className="size-4" />
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      aria-pressed={status === "ABSENT"}
                      aria-label={`Mark ${student.firstName} ${student.lastName} absent`}
                      onClick={() => setStatus(student.studentId, "ABSENT")}
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-md border transition-colors",
                        status === "ABSENT"
                          ? "border-red-300 bg-red-100 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <X className="size-4" />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Save Attendance
        </Button>
      </div>
    </div>
  );
}
