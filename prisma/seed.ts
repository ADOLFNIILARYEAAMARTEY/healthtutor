import { PrismaClient, type AttendanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("Seeding database...");

  await prisma.score.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "Dr. Abena Owusu-Antwi",
      email: "admin@healthtutor.com",
      passwordHash: await hash("Admin123!"),
      role: "ADMIN",
    },
  });

  const tutor1 = await prisma.user.create({
    data: {
      name: "Kwabena Asiedu",
      email: "tutor@healthtutor.com",
      passwordHash: await hash("Tutor123!"),
      role: "TUTOR",
    },
  });

  const tutor2 = await prisma.user.create({
    data: {
      name: "Efua Darko",
      email: "tutor2@healthtutor.com",
      passwordHash: await hash("Tutor123!"),
      role: "TUTOR",
    },
  });

  console.log(`Created users: ${admin.email}, ${tutor1.email}, ${tutor2.email}`);

  const courseData = [
    {
      courseCode: "BIO201",
      courseName: "Human Anatomy & Physiology",
      description: "Structure and function of the major human body systems.",
      tutorId: tutor1.id,
    },
    {
      courseCode: "NURS150",
      courseName: "Community Health Nursing",
      description: "Principles of community-based nursing practice.",
      tutorId: tutor1.id,
    },
    {
      courseCode: "PHT210",
      courseName: "Pharmacology Fundamentals",
      description: "Core concepts in drug action, dosage, and safety.",
      tutorId: tutor2.id,
    },
  ];

  const courses = [];
  for (const c of courseData) {
    courses.push(await prisma.course.create({ data: c }));
  }
  const [bio, nurs, pht] = courses;
  console.log(`Created ${courses.length} courses`);

  interface StudentProfile {
    firstName: string;
    lastName: string;
    gender: "MALE" | "FEMALE";
    attendanceRate: number; // fraction of sessions present, per course
    academicRate: number; // approximate score percentage, per course
    courses: (typeof bio)[];
  }

  const students: StudentProfile[] = [
    { firstName: "Ama", lastName: "Mensah", gender: "FEMALE", attendanceRate: 1.0, academicRate: 0.88, courses: [bio, nurs] },
    { firstName: "Kwame", lastName: "Asare", gender: "MALE", attendanceRate: 0.8, academicRate: 0.75, courses: [bio] },
    { firstName: "Akosua", lastName: "Boateng", gender: "FEMALE", attendanceRate: 0.4, academicRate: 0.7, courses: [bio, pht] },
    { firstName: "Kofi", lastName: "Owusu", gender: "MALE", attendanceRate: 0.8, academicRate: 0.35, courses: [bio] },
    { firstName: "Abena", lastName: "Ofori", gender: "FEMALE", attendanceRate: 0.4, academicRate: 0.3, courses: [bio, nurs] },
    { firstName: "Yaw", lastName: "Addo", gender: "MALE", attendanceRate: 1.0, academicRate: 0.92, courses: [nurs] },
    { firstName: "Efua", lastName: "Amponsah", gender: "FEMALE", attendanceRate: 0.6, academicRate: 0.65, courses: [nurs] },
    { firstName: "Kwesi", lastName: "Danso", gender: "MALE", attendanceRate: 0.8, academicRate: 0.6, courses: [nurs, pht] },
    { firstName: "Adjoa", lastName: "Sarpong", gender: "FEMALE", attendanceRate: 0.2, academicRate: 0.25, courses: [pht] },
    { firstName: "Kojo", lastName: "Appiah", gender: "MALE", attendanceRate: 1.0, academicRate: 0.45, courses: [pht] },
    { firstName: "Afia", lastName: "Nyarko", gender: "FEMALE", attendanceRate: 0.8, academicRate: 0.7, courses: [pht, bio] },
    { firstName: "Kwabena", lastName: "Frimpong", gender: "MALE", attendanceRate: 0.6, academicRate: 0.55, courses: [bio] },
    { firstName: "Esi", lastName: "Aidoo", gender: "FEMALE", attendanceRate: 1.0, academicRate: 0.95, courses: [nurs] },
    { firstName: "Yaa", lastName: "Gyamfi", gender: "FEMALE", attendanceRate: 0.4, academicRate: 0.4, courses: [nurs, pht] },
    { firstName: "Kwadwo", lastName: "Tetteh", gender: "MALE", attendanceRate: 0.8, academicRate: 0.48, courses: [pht] },
    { firstName: "Adwoa", lastName: "Anin", gender: "FEMALE", attendanceRate: 0.8, academicRate: 0.82, courses: [bio, nurs, pht] },
  ];

  const createdStudents = [];
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const studentNumber = `HT/2024/${String(i + 1).padStart(3, "0")}`;
    const student = await prisma.student.create({
      data: {
        studentNumber,
        firstName: s.firstName,
        lastName: s.lastName,
        email: `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@student.healthtutor.com`,
        phone: `+2332400${String(100 + i)}`,
        gender: s.gender,
      },
    });
    createdStudents.push({ ...s, record: student });
  }
  console.log(`Created ${createdStudents.length} students`);

  for (const s of createdStudents) {
    for (const course of s.courses) {
      await prisma.enrollment.create({
        data: { studentId: s.record.id, courseId: course.id },
      });
    }
  }
  console.log("Created enrollments");

  const SESSIONS_PER_COURSE = 5;
  const now = new Date("2026-08-14T09:00:00Z");
  const sessionTopics = [
    "Introduction & Orientation",
    "Core Concepts I",
    "Core Concepts II",
    "Applied Case Studies",
    "Review & Practical Session",
  ];

  const courseSessions = new Map<string, { id: string; sessionDate: Date }[]>();

  for (const course of courses) {
    const sessions = [];
    for (let i = 0; i < SESSIONS_PER_COURSE; i++) {
      const sessionDate = new Date(now);
      sessionDate.setDate(sessionDate.getDate() - (SESSIONS_PER_COURSE - i) * 7);
      const session = await prisma.classSession.create({
        data: {
          courseId: course.id,
          sessionDate,
          topic: sessionTopics[i],
        },
      });
      sessions.push(session);
    }
    courseSessions.set(course.id, sessions);
  }
  console.log(`Created ${SESSIONS_PER_COURSE} sessions for each of ${courses.length} courses`);

  for (const s of createdStudents) {
    for (const course of s.courses) {
      const sessions = courseSessions.get(course.id)!;
      const presentCount = Math.round(s.attendanceRate * sessions.length);
      for (let i = 0; i < sessions.length; i++) {
        const status: AttendanceStatus = i < presentCount ? "PRESENT" : "ABSENT";
        await prisma.attendance.create({
          data: {
            sessionId: sessions[i].id,
            studentId: s.record.id,
            status,
          },
        });
      }
    }
  }
  console.log("Created attendance records");

  const assessmentTemplates = [
    { title: "Quiz 1", assessmentType: "Quiz", maximumScore: 20, weight: 15 },
    { title: "Assignment 1", assessmentType: "Assignment", maximumScore: 50, weight: 15 },
    { title: "Mid-Semester Exam", assessmentType: "Mid-Semester", maximumScore: 100, weight: 30 },
    { title: "Final Examination", assessmentType: "Examination", maximumScore: 100, weight: 40 },
  ];

  const courseAssessments = new Map<string, { id: string; maximumScore: number }[]>();

  for (const course of courses) {
    const assessments = [];
    for (const template of assessmentTemplates) {
      const assessment = await prisma.assessment.create({
        data: { courseId: course.id, ...template },
      });
      assessments.push(assessment);
    }
    courseAssessments.set(course.id, assessments);
  }
  console.log(`Created ${assessmentTemplates.length} assessments for each of ${courses.length} courses`);

  for (const s of createdStudents) {
    for (const course of s.courses) {
      const assessments = courseAssessments.get(course.id)!;
      for (const assessment of assessments) {
        // Small deterministic variation so scores aren't perfectly uniform.
        const jitter = ((assessment.maximumScore * 7) % 5) - 2;
        const rawScore = s.academicRate * assessment.maximumScore + jitter;
        const score = Math.max(0, Math.min(assessment.maximumScore, Math.round(rawScore)));
        await prisma.score.create({
          data: {
            assessmentId: assessment.id,
            studentId: s.record.id,
            score,
          },
        });
      }
    }
  }
  console.log("Created scores");

  console.log("Seeding complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
