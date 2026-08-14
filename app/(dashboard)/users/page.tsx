import type { Metadata } from "next";

import { requireAdmin } from "@/lib/permissions";
import { listAllUsers } from "@/lib/db/users";
import { UsersTable } from "@/components/users/users-table";
import { CreateUserDialog } from "@/components/users/create-user-dialog";

export const metadata: Metadata = {
  title: "Users | HealthTutor",
};

export default async function UsersPage() {
  const admin = await requireAdmin();
  const users = await listAllUsers();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
          <p className="mt-1 text-muted-foreground">
            Manage administrator and tutor accounts across the system.
          </p>
        </div>
        <CreateUserDialog />
      </div>

      <UsersTable users={users} currentUserId={admin.id} />
    </div>
  );
}
