import { Activity } from "lucide-react";
import type { Role } from "@prisma/client";

import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

export function Sidebar({
  name,
  role,
}: {
  name: string;
  role: Role;
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Activity className="size-4" />
        </div>
        <span className="text-base font-semibold tracking-tight">HealthTutor</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks role={role} />
      </div>

      <div className="border-t border-sidebar-border p-3">
        <UserMenu name={name} role={role} />
      </div>
    </aside>
  );
}
