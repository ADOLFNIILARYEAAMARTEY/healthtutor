import { prisma } from "@/lib/db/prisma";

export async function listTutorsWithStats() {
  const tutors = await prisma.user.findMany({
    where: { role: "TUTOR" },
    include: { courses: true },
    orderBy: { name: "asc" },
  });

  return tutors.map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    isActive: t.isActive,
    courseCount: t.courses.length,
  }));
}

export type TutorWithStats = Awaited<ReturnType<typeof listTutorsWithStats>>[number];
