"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/dashboard/risk-badge";
import { ConfirmActionDialog } from "@/components/dashboard/confirm-action-dialog";
import { StudentDialog } from "@/components/students/student-dialog";
import { formatPercentage, formatStudentName } from "@/lib/format";
import { RISK_LABELS, type RiskStatus } from "@/lib/calculations/risk";
import { deleteStudentAction } from "@/app/(dashboard)/students/actions";
import type { StudentWithStats } from "@/lib/db/students";

const RISK_FILTERS: { value: RiskStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "GOOD_STANDING", label: RISK_LABELS.GOOD_STANDING },
  { value: "ATTENDANCE_RISK", label: RISK_LABELS.ATTENDANCE_RISK },
  { value: "ACADEMIC_RISK", label: RISK_LABELS.ACADEMIC_RISK },
  { value: "HIGH_RISK", label: RISK_LABELS.HIGH_RISK },
];

export function StudentsTable({
  students,
  canManage,
}: {
  students: StudentWithStats[];
  canManage: boolean;
}) {
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskStatus | "ALL">("ALL");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      const matchesQuery =
        !q ||
        formatStudentName(s).toLowerCase().includes(q) ||
        s.studentNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q);
      const matchesRisk = riskFilter === "ALL" || s.risk === riskFilter;
      return matchesQuery && matchesRisk;
    });
  }, [students, query, riskFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or student number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
            aria-label="Search students"
          />
        </div>
        <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskStatus | "ALL")}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Filter by risk status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RISK_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {students.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No students match your search or filter criteria.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Courses</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Academic Average</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.studentNumber}</TableCell>
                  <TableCell>
                    <Link href={`/students/${student.id}`} className="hover:underline">
                      {formatStudentName(student)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{student.email}</TableCell>
                  <TableCell className="text-center">{student.courseCount}</TableCell>
                  <TableCell>{formatPercentage(student.attendancePercentage)}</TableCell>
                  <TableCell>{formatPercentage(student.academicAverage)}</TableCell>
                  <TableCell>
                    <RiskBadge status={student.risk} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {canManage ? (
                        <>
                          <StudentDialog student={student} />
                          <ConfirmActionDialog
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Delete student"
                                title="Delete student"
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            }
                            title="Delete student?"
                            description={`This permanently deletes ${formatStudentName(student)} (${student.studentNumber}). This cannot be undone if the student has no attendance or score records.`}
                            successMessage="Student deleted successfully."
                            action={deleteStudentAction.bind(null, student.id)}
                          />
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
      No students have been registered yet.
    </div>
  );
}
