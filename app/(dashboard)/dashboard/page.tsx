import type { Metadata } from "next";
import { AlertTriangle, CalendarCheck, GraduationCap, Users } from "lucide-react";

import { requireUser } from "@/lib/permissions";
import { getDashboardSummary, getAttendanceOverview } from "@/lib/db/dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { AttendanceDonut } from "@/components/dashboard/attendance-donut";
import { AcademicPerformanceChart } from "@/components/dashboard/academic-performance-chart";
import { AtRiskTable } from "@/components/dashboard/at-risk-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercentage } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard | HealthTutor",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const scope = isAdmin ? undefined : { tutorId: user.id };

  const [summary, attendanceOverview] = await Promise.all([
    getDashboardSummary(scope),
    getAttendanceOverview(scope),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = (user.name ?? "there").split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s an overview of student academic engagement.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={summary.totalStudents} icon={Users} />
        <StatCard
          label="Average Attendance"
          value={formatPercentage(summary.avgAttendance)}
          icon={CalendarCheck}
        />
        <StatCard
          label="Average Academic Score"
          value={formatPercentage(summary.avgAcademicScore)}
          icon={GraduationCap}
        />
        <StatCard
          label="At-Risk Students"
          value={summary.atRiskStudentCount}
          icon={AlertTriangle}
          tone={summary.atRiskStudentCount > 0 ? "danger" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceDonut present={attendanceOverview.present} absent={attendanceOverview.absent} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Academic Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <AcademicPerformanceChart distribution={summary.distribution} />
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Students Requiring Attention</h2>
        <AtRiskTable rows={summary.atRiskRows} />
      </div>
    </div>
  );
}
