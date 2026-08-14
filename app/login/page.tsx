import type { Metadata } from "next";
import { Activity } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign In | HealthTutor",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-center bg-sidebar px-16 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2 text-sidebar-foreground">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Activity className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">HealthTutor</span>
        </div>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-balance">
          Student Attendance &amp; Academic Monitoring
        </h1>
        <p className="mt-4 max-w-md text-sidebar-foreground/70">
          Monitor attendance, track academic progress, and identify students who
          need support.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-2 text-center lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">HealthTutor</span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your tutor or administrator account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>

          <div className="mt-6 rounded-md border border-dashed px-4 py-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Demo credentials</p>
            <p className="mt-1">Admin: admin@healthtutor.com / Admin123!</p>
            <p>Tutor: tutor@healthtutor.com / Tutor123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
