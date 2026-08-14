"use client";

import { useState, useTransition } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignCourseToTutorAction } from "@/app/(dashboard)/tutors/actions";

interface CourseOption {
  id: string;
  courseCode: string;
  courseName: string;
  tutorName: string;
}

export function AssignCourseDialog({
  tutorId,
  tutorName,
  courses,
}: {
  tutorId: string;
  tutorName: string;
  courses: CourseOption[];
}) {
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!courseId) return;
    startTransition(async () => {
      const result = await assignCourseToTutorAction(tutorId, courseId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Course assigned to ${tutorName}.`);
      setCourseId(undefined);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Assign course" title="Assign course">
            <BookOpen className="size-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Course</DialogTitle>
          <DialogDescription>
            Choose a course to assign to {tutorName}. This will move the course away from its
            current tutor, if any.
          </DialogDescription>
        </DialogHeader>

        <Select value={courseId} onValueChange={(v) => setCourseId(v ?? undefined)}>
          <SelectTrigger className="w-full" aria-label="Select course">
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.courseCode} — {c.courseName} (currently {c.tutorName})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isPending || !courseId}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Assign Course
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
