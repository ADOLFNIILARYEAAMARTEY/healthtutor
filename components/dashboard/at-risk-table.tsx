import Link from "next/link";

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
import { formatPercentage } from "@/lib/format";
import type { MonitoringRow } from "@/lib/db/monitoring";

const DISPLAY_LIMIT = 5;

export function AtRiskTable({ rows }: { rows: MonitoringRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No students currently match the selected risk criteria.
      </div>
    );
  }

  const visible = rows.slice(0, DISPLAY_LIMIT);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Student Number</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Academic Average</TableHead>
              <TableHead>Risk Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => (
              <TableRow key={`${row.studentId}-${row.courseId}`}>
                <TableCell className="font-medium">{row.studentName}</TableCell>
                <TableCell className="text-muted-foreground">{row.studentNumber}</TableCell>
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
      {rows.length > DISPLAY_LIMIT ? (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" render={<Link href="/monitoring">View All</Link>} />
        </div>
      ) : null}
    </div>
  );
}
