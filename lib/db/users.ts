import { prisma } from "@/lib/db/prisma";

export async function listAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export type UserListItem = Awaited<ReturnType<typeof listAllUsers>>[number];
