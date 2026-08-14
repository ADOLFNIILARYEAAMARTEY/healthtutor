import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CalendarCheck, GraduationCap, ShieldAlert } from "lucide-react";

import { requireUser, PermissionError } from "@/lib/permissions";
import { getStudentProfile } from "@/lib/db/students";
import { prisma } from "@/lib/db/prisma";
import { RiskBadge } from "@/components/dashboard/risk-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { AttendanceDonut } from "@/components/dashboard/attendance-donut";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPercentage, formatStudentName } from "@/lib/format";

export const metadata: Metadata = {
  title: "Student Profile | HealthTutor",
};

async function assertCanViewStudent(studentId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return;
  const enrolled = await prisma.enrollment.findFirst({
    where: { studentId, course: { tutorId: userId } },
  });
  if (!enrolled) throw new PermissionError();
}

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  await assertCanViewStudent(id, user.id, isAdmin).catch(() => {
    notFound();
  });

  const profile = await getStudentProfile(id);
  if (!profile) notFound();

  const totalPresent = profile.attendanceByCourse.reduce((sum, c) => sum + c.present, 0);
  const totalAbsent = profile.attendanceByCourse.reduce((sum, c) => sum + c.absent, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {formatStudentName(profile)}
            </h1>
            <RiskBadge status={profile.risk} />
          </div>
          <p className="mt-1 text-muted-foreground">
            {profile.studentNumber} &middot; {profile.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Courses Enrolled" value={profile.courses.length} icon={BookOpen} />
        <StatCard
          label="Overall Attendance"
          value={formatPercentage(profile.overallAttendance)}
          icon={CalendarCheck}
          tone={
            profile.overallAttendance !== null && profile.overallAttendance < 75
              ? "warning"
              : "default"
          }
        />
        <StatCard
          label="Academic Average"
          value={formatPercentage(profile.overallAcademic)}
          icon={GraduationCap}
          tone={
            profile.overallAcademic !== null && profile.overallAcademic < 50
              ? "danger"
              : "default"
          }
        />
        <StatCard
          label="Risk Status"
          value={profile.risk === "GOOD_STANDING" ? "Good Standing" : "Needs Attention"}
          icon={ShieldAlert}
          tone={profile.risk === "GOOD_STANDING" ? "success" : "danger"}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="performance">Academic Performance</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceDonut present={totalPresent} absent={totalAbsent} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance by Course</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {profile.attendanceByCourse.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  No attendance data is available for this student yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead className="text-center">Total Sessions</TableHead>
                        <TableHead className="text-center">Present</TableHead>
                        <TableHead className="text-center">Absent</TableHead>
                        <TableHead>Attendance %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profile.attendanceByCourse.map((c) => (
                        <TableRow key={c.courseId}>
                          <TableCell>
                            <Link href={`/courses/${c.courseId}`} className="font-medium hover:underline">
                              {c.courseCode}
                            </Link>{" "}
                            <span className="text-muted-foreground">{c.courseName}</span>
                          </TableCell>
                          <TableCell className="text-center">{c.totalSessions}</TableCell>
                          <TableCell className="text-center">{c.present}</TableCell>
                          <TableCell className="text-center">{c.absent}</TableCell>
                          <TableCell>{formatPercentage(c.attendancePercentage)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Academic Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {profile.performanceRows.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  No scores have been recorded for this student yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Assessment</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead className="text-center">Maximum</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead className="text-center">Weight</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profile.performanceRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="text-muted-foreground">{row.courseCode}</TableCell>
                          <TableCell>{row.assessmentTitle}</TableCell>
                          <TableCell className="text-center">{row.score}</TableCell>
                          <TableCell className="text-center">{row.maximumScore}</TableCell>
                          <TableCell>{formatPercentage(row.percentage)}</TableCell>
                          <TableCell className="text-center">{row.weight}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="mt-4">
          {profile.courses.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              This student is not enrolled in any courses yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.courses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <Card className="transition-colors hover:border-primary/40">
                    <CardHeader>
                      <CardTitle className="text-base">{course.courseCode}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">{course.courseName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Tutor: {course.tutorName}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
