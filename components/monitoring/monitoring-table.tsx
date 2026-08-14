"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RiskBadge } from "@/components/dashboard/risk-badge";
import { formatPercentage } from "@/lib/format";
import { RISK_LABELS, RISK_SEVERITY, type RiskStatus } from "@/lib/calculations/risk";
import type { MonitoringRow } from "@/lib/db/monitoring";

type SortOption = "risk" | "attendance" | "academic";

const SORT_LABELS: Record<SortOption, string> = {
  risk: "Highest Risk",
  attendance: "Lowest Attendance",
  academic: "Lowest Academic Average",
};

interface CourseOption {
  id: string;
  courseCode: string;
  courseName: string;
}

export function MonitoringTable({
  rows,
  courses,
}: {
  rows: MonitoringRow[];
  courses: CourseOption[];
}) {
  const [courseFilter, setCourseFilter] = useState<string>("ALL");
  const [riskFilter, setRiskFilter] = useState<RiskStatus | "ALL">("ALL");
  const [minAttendance, setMinAttendance] = useState("");
  const [maxAttendance, setMaxAttendance] = useState("");
  const [minAcademic, setMinAcademic] = useState("");
  const [maxAcademic, setMaxAcademic] = useState("");
  const [sort, setSort] = useState<SortOption>("risk");

  const filtered = useMemo(() => {
    const minAtt = minAttendance === "" ? null : Number(minAttendance);
    const maxAtt = maxAttendance === "" ? null : Number(maxAttendance);
    const minAcad = minAcademic === "" ? null : Number(minAcademic);
    const maxAcad = maxAcademic === "" ? null : Number(maxAcademic);

    const result = rows.filter((row) => {
      if (courseFilter !== "ALL" && row.courseId !== courseFilter) return false;
      if (riskFilter !== "ALL" && row.risk !== riskFilter) return false;
      if (minAtt !== null && (row.attendancePercentage === null || row.attendancePercentage < minAtt))
        return false;
      if (maxAtt !== null && (row.attendancePercentage === null || row.attendancePercentage > maxAtt))
        return false;
      if (minAcad !== null && (row.academicAverage === null || row.academicAverage < minAcad))
        return false;
      if (maxAcad !== null && (row.academicAverage === null || row.academicAverage > maxAcad))
        return false;
      return true;
    });

    const sorted = [...result];
    if (sort === "risk") {
      sorted.sort((a, b) => RISK_SEVERITY[b.risk] - RISK_SEVERITY[a.risk]);
    } else if (sort === "attendance") {
      sorted.sort((a, b) => (a.attendancePercentage ?? 101) - (b.attendancePercentage ?? 101));
    } else {
      sorted.sort((a, b) => (a.academicAverage ?? 101) - (b.academicAverage ?? 101));
    }
    return sorted;
  }, [rows, courseFilter, riskFilter, minAttendance, maxAttendance, minAcademic, maxAcademic, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Course</Label>
          <Select value={courseFilter} onValueChange={(v) => setCourseFilter(v ?? "ALL")}>
            <SelectTrigger className="w-48" aria-label="Filter by course">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Courses</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.courseCode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Risk Status</Label>
          <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskStatus | "ALL")}>
            <SelectTrigger className="w-44" aria-label="Filter by risk status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {(Object.keys(RISK_LABELS) as RiskStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {RISK_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Attendance Range (%)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="Min"
              value={minAttendance}
              onChange={(e) => setMinAttendance(e.target.value)}
              className="w-20"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="Max"
              value={maxAttendance}
              onChange={(e) => setMaxAttendance(e.target.value)}
              className="w-20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Academic Range (%)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="Min"
              value={minAcademic}
              onChange={(e) => setMinAcademic(e.target.value)}
              className="w-20"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="Max"
              value={maxAcademic}
              onChange={(e) => setMaxAcademic(e.target.value)}
              className="w-20"
            />
          </div>
        </div>

        <div className="ml-auto space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sort By</Label>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-52" aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {SORT_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No students currently match the selected risk criteria.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Attendance %</TableHead>
                <TableHead>Academic Average</TableHead>
                <TableHead>Risk Classification</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow
                  key={`${row.studentId}-${row.courseId}`}
                  className={row.risk === "HIGH_RISK" ? "bg-red-50/60 dark:bg-red-950/20" : undefined}
                >
                  <TableCell className="font-medium">
                    {row.studentName}
                    <span className="ml-1.5 text-xs text-muted-foreground">{row.studentNumber}</span>
                  </TableCell>
                  <TableCell>{row.courseCode}</TableCell>
                  <TableCell>{formatPercentage(row.attendancePercentage)}</TableCell>
                  <TableCell>{formatPercentage(row.academicAverage)}</TableCell>
                  <TableCell>
                    <RiskBadge status={row.risk} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/students/${row.studentId}`}>View Profile</Link>}
                    />
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
