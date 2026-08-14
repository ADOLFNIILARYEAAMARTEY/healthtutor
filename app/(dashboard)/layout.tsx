import { requireUser } from "@/lib/permissions";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const name = user.name ?? user.email ?? "User";

  return (
    <div className="flex min-h-screen">
      <Sidebar name={name} role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header name={name} role={user.role} />
        <main className="flex-1 overflow-x-hidden px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
