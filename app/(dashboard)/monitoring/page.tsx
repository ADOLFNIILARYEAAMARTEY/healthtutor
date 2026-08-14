import type { Metadata } from "next";
import { CheckCircle2, AlertCircle, TrendingDown, Flame, Users } from "lucide-react";

import { requireUser } from "@/lib/permissions";
import { getMonitoringRows, summarizeWorstRiskByStudent } from "@/lib/db/monitoring";
import { listCoursesWithStats } from "@/lib/db/courses";
import { StatCard } from "@/components/dashboard/stat-card";
import { MonitoringTable } from "@/components/monitoring/monitoring-table";

export const metadata: Metadata = {
  title: "Academic Monitoring | HealthTutor",
};

export default async function MonitoringPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const scope = isAdmin ? undefined : { tutorId: user.id };

  const [rows, courses] = await Promise.all([
    getMonitoringRows(scope),
    listCoursesWithStats(scope),
  ]);

  const worstByStudent = summarizeWorstRiskByStudent(rows);
  const counts = { GOOD_STANDING: 0, ATTENDANCE_RISK: 0, ACADEMIC_RISK: 0, HIGH_RISK: 0 };
  for (const status of worstByStudent.values()) counts[status]++;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Academic Monitoring</h1>
        <p className="mt-1 text-muted-foreground">
          Track attendance and academic performance to identify students who need support.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Monitored" value={worstByStudent.size} icon={Users} />
        <StatCard label="Good Standing" value={counts.GOOD_STANDING} icon={CheckCircle2} tone="success" />
        <StatCard label="Attendance Risk" value={counts.ATTENDANCE_RISK} icon={TrendingDown} tone="warning" />
        <StatCard label="Academic Risk" value={counts.ACADEMIC_RISK} icon={AlertCircle} tone="warning" />
        <StatCard label="High Risk" value={counts.HIGH_RISK} icon={Flame} tone="danger" />
      </div>

      <MonitoringTable rows={rows} courses={courses} />
    </div>
  );
}
