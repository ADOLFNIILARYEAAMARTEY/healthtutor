"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { enrollStudentsAction } from "@/app/(dashboard)/courses/actions";
import { formatStudentName } from "@/lib/format";

interface UnenrolledStudent {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
}

export function EnrollStudentsDialog({
  courseId,
  candidates,
}: {
  courseId: string;
  candidates: UnenrolledStudent[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (s) =>
        formatStudentName(s).toLowerCase().includes(q) ||
        s.studentNumber.toLowerCase().includes(q)
    );
  }, [candidates, query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await enrollStudentsAction(courseId, Array.from(selected));
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Enrolled ${selected.size} student${selected.size === 1 ? "" : "s"} successfully.`);
      setSelected(new Set());
      setQuery("");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <UserPlus className="size-4" />
            Enroll Students
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enroll Students</DialogTitle>
          <DialogDescription>
            Select one or more students to enroll in this course.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or student number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="max-h-72 overflow-y-auto rounded-md border">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              {candidates.length === 0
                ? "All students are already enrolled in this course."
                : "No students match your search."}
            </p>
          ) : (
            <ul className="divide-y">
              {filtered.map((student) => (
                <li key={student.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted">
                    <Checkbox
                      checked={selected.has(student.id)}
                      onCheckedChange={() => toggle(student.id)}
                    />
                    <span className="flex-1 text-sm">{formatStudentName(student)}</span>
                    <span className="text-xs text-muted-foreground">{student.studentNumber}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isPending || selected.size === 0}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Enroll {selected.size > 0 ? selected.size : ""} Student
            {selected.size === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
