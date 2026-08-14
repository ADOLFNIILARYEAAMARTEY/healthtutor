import type { Role } from "@prisma/client";
import { Activity } from "lucide-react";

import { MobileNav } from "./mobile-nav";

export function Header({ name, role }: { name: string; role: Role }) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-background px-4 lg:px-6">
      <MobileNav name={name} role={role} />
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Activity className="size-3.5" />
        </div>
        <span className="text-sm font-semibold tracking-tight">HealthTutor</span>
      </div>
    </header>
  );
}
