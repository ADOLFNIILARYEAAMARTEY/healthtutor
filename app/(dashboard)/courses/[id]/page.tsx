import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { AlertTriangle, CalendarCheck, ClipboardList, GraduationCap, Users, UserX } from "lucide-react";

import { requireUser, PermissionError } from "@/lib/permissions";
import { getCourseDetail, listUnenrolledStudents } from "@/lib/db/courses";
import { StatCard } from "@/components/dashboard/stat-card";
import { RiskBadge } from "@/components/dashboard/risk-badge";
import { EnrollStudentsDialog } from "@/components/courses/enroll-students-dialog";
import { ConfirmActionDialog } from "@/components/dashboard/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPercentage } from "@/lib/format";
import { removeEnrollmentAction } from "@/app/(dashboard)/courses/actions";

export const metadata: Metadata = {
  title: "Course Details | HealthTutor",
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const course = await getCourseDetail(id);
  if (!course) notFound();

  if (!isAdmin && course.tutorId !== user.id) {
    throw new PermissionError();
  }

  const unenrolled = isAdmin ? await listUnenrolledStudents(id) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{course.courseCode}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{course.courseName}</h1>
          <p className="mt-1 text-muted-foreground">Tutor: {course.tutorName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Students" value={course.totalStudents} icon={Users} />
        <StatCard label="Total Sessions" value={course.totalSessions} icon={CalendarCheck} />
        <StatCard label="Avg Attendance" value={formatPercentage(course.avgAttendance)} icon={ClipboardList} />
        <StatCard label="Avg Score" value={formatPercentage(course.avgScore)} icon={GraduationCap} />
        <StatCard
          label="At-Risk Students"
          value={course.atRiskCount}
          icon={AlertTriangle}
          tone={course.atRiskCount > 0 ? "danger" : "default"}
        />
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4 space-y-4">
          {isAdmin ? (
            <div className="flex justify-end">
              <EnrollStudentsDialog courseId={course.id} candidates={unenrolled} />
            </div>
          ) : null}
          <Card>
            <CardContent className="p-0">
              {course.students.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No students are enrolled in this course yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead>Academic Average</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {course.students.map((s) => (
                        <TableRow key={s.studentId}>
                          <TableCell className="font-medium">{s.studentNumber}</TableCell>
                          <TableCell>
                            <Link href={`/students/${s.studentId}`} className="hover:underline">
                              {s.firstName} {s.lastName}
                            </Link>
                          </TableCell>
                          <TableCell>{formatPercentage(s.attendancePercentage)}</TableCell>
                          <TableCell>{formatPercentage(s.academicAverage)}</TableCell>
                          <TableCell>
                            <RiskBadge status={s.risk} />
                          </TableCell>
                          <TableCell className="text-right">
                            {isAdmin ? (
                              <ConfirmActionDialog
                                trigger={
                                  <Button variant="ghost" size="icon-sm" aria-label="Remove from course" title="Remove from course">
                                    <UserX className="size-4 text-destructive" />
                                  </Button>
                                }
                                title="Remove student from course?"
                                description={`${s.firstName} ${s.lastName} will be unenrolled from ${course.courseCode}. Their existing attendance and score records are kept.`}
                                confirmLabel="Remove"
                                successMessage="Student removed from course."
                                action={removeEnrollmentAction.bind(null, course.id, s.studentId)}
                              />
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                render={<Link href={`/students/${s.studentId}`}>View Profile</Link>}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Sessions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {course.sessions.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No class sessions are available for this course.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Topic</TableHead>
                        <TableHead className="text-center">Present</TableHead>
                        <TableHead className="text-center">Absent</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {course.sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{format(session.sessionDate, "PPP")}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {session.topic ?? "—"}
                          </TableCell>
                          <TableCell className="text-center">{session.present}</TableCell>
                          <TableCell className="text-center">{session.absent}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              render={
                                <Link href={`/attendance?course=${course.id}&session=${session.id}`}>
                                  {session.marked > 0 ? "Edit Attendance" : "Mark Attendance"}
                                </Link>
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {course.assessments.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No assessments have been created for this course yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-center">Max Score</TableHead>
                        <TableHead className="text-center">Weight</TableHead>
                        <TableHead className="text-center">Students Scored</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {course.assessments.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.title}</TableCell>
                          <TableCell className="text-muted-foreground">{a.assessmentType}</TableCell>
                          <TableCell className="text-center">{a.maximumScore}</TableCell>
                          <TableCell className="text-center">{a.weight}%</TableCell>
                          <TableCell className="text-center">
                            {a.studentsScored} / {course.totalStudents}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              render={
                                <Link href={`/assessments?course=${course.id}&assessment=${a.id}`}>
                                  Enter Scores
                                </Link>
                              }
                            />
                          </TableCell>
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
              {course.students.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No students are enrolled in this course yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Academic Average</TableHead>
                        <TableHead>Risk</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...course.students]
                        .sort((a, b) => (a.academicAverage ?? 101) - (b.academicAverage ?? 101))
                        .map((s) => (
                          <TableRow key={s.studentId}>
                            <TableCell className="font-medium">{s.studentNumber}</TableCell>
                            <TableCell>
                              <Link href={`/students/${s.studentId}`} className="hover:underline">
                                {s.firstName} {s.lastName}
                              </Link>
                            </TableCell>
                            <TableCell>{formatPercentage(s.academicAverage)}</TableCell>
                            <TableCell>
                              <RiskBadge status={s.risk} />
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
