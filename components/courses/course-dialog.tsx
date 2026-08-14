"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCourseAction,
  updateCourseAction,
  type CourseFormState,
} from "@/app/(dashboard)/courses/actions";
import type { CourseWithStats } from "@/lib/db/courses";

const initialState: CourseFormState = {};

interface CourseDialogProps {
  course?: Pick<
    CourseWithStats,
    "id" | "courseCode" | "courseName" | "description" | "tutorId"
  >;
  tutors: { id: string; name: string }[];
}

export function CourseDialog({ course, tutors }: CourseDialogProps) {
  const isEdit = !!course;
  const [open, setOpen] = useState(false);
  const formId = useId();

  const action = isEdit ? updateCourseAction.bind(null, course.id) : createCourseAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(isEdit ? "Course updated successfully." : "Course created successfully.");
      setOpen(false);
    }
  }, [state.success, isEdit]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon-sm" aria-label="Edit course" title="Edit course">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button>
              <Plus className="size-4" />
              Add Course
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Course" : "Add Course"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this course's details." : "Create a new course and assign a tutor."}
          </DialogDescription>
        </DialogHeader>

        {state.error ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {state.error}
          </div>
        ) : null}

        <form id={formId} action={formAction} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-courseCode`}>Course Code</Label>
            <Input
              id={`${formId}-courseCode`}
              name="courseCode"
              defaultValue={course?.courseCode}
              aria-invalid={!!state.fieldErrors?.courseCode}
              required
            />
            {state.fieldErrors?.courseCode ? (
              <p className="text-sm text-destructive">{state.fieldErrors.courseCode}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-courseName`}>Course Name</Label>
            <Input
              id={`${formId}-courseName`}
              name="courseName"
              defaultValue={course?.courseName}
              aria-invalid={!!state.fieldErrors?.courseName}
              required
            />
            {state.fieldErrors?.courseName ? (
              <p className="text-sm text-destructive">{state.fieldErrors.courseName}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-tutorId`}>Tutor</Label>
            <Select name="tutorId" defaultValue={course?.tutorId}>
              <SelectTrigger id={`${formId}-tutorId`} className="w-full">
                <SelectValue placeholder="Assign a tutor" />
              </SelectTrigger>
              <SelectContent>
                {tutors.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.tutorId ? (
              <p className="text-sm text-destructive">{state.fieldErrors.tutorId}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-description`}>Description (optional)</Label>
            <Textarea
              id={`${formId}-description`}
              name="description"
              defaultValue={course?.description ?? ""}
              rows={3}
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {isEdit ? "Save Changes" : "Add Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
