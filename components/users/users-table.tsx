"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/dashboard/confirm-action-dialog";
import { toggleUserStatusAction } from "@/app/(dashboard)/users/actions";
import type { UserListItem } from "@/lib/db/users";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  TUTOR: "Tutor",
};

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserListItem[];
  currentUserId: string;
}) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No users have been created yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} isSelf={user.id === currentUserId} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UserRow({ user, isSelf }: { user: UserListItem; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition();

  function enable() {
    startTransition(async () => {
      const result = await toggleUserStatusAction(user.id, true);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("User enabled successfully.");
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        {user.name}
        {isSelf ? <span className="ml-1.5 text-xs text-muted-foreground">(you)</span> : null}
      </TableCell>
      <TableCell className="text-muted-foreground">{user.email}</TableCell>
      <TableCell>{ROLE_LABELS[user.role] ?? user.role}</TableCell>
      <TableCell>
        <span
          className={
            user.isActive
              ? "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
          }
        >
          {user.isActive ? "Active" : "Disabled"}
        </span>
      </TableCell>
      <TableCell className="text-right">
        {user.isActive ? (
          <ConfirmActionDialog
            trigger={
              <Button variant="outline" size="sm" disabled={isSelf} title={isSelf ? "You cannot disable your own account" : undefined}>
                Disable
              </Button>
            }
            title="Disable this user?"
            description={`${user.name} will no longer be able to log in.`}
            confirmLabel="Disable"
            successMessage="User disabled successfully."
            action={toggleUserStatusAction.bind(null, user.id, false)}
          />
        ) : (
          <Button variant="outline" size="sm" disabled={isPending} onClick={enable}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Enable
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
