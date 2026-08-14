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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createStudentAction,
  updateStudentAction,
  type StudentFormState,
} from "@/app/(dashboard)/students/actions";
import type { StudentWithStats } from "@/lib/db/students";

const initialState: StudentFormState = {};

interface StudentDialogProps {
  student?: Pick<
    StudentWithStats,
    "id" | "studentNumber" | "firstName" | "lastName" | "email"
  > & { phone?: string | null; gender?: string | null };
}

export function StudentDialog({ student }: StudentDialogProps) {
  const isEdit = !!student;
  const [open, setOpen] = useState(false);
  const formId = useId();

  const action = isEdit
    ? updateStudentAction.bind(null, student.id)
    : createStudentAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(isEdit ? "Student updated successfully." : "Student created successfully.");
      setOpen(false);
    }
  }, [state.success, isEdit]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
      }}
    >
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon-sm" aria-label="Edit student" title="Edit student">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button>
              <Plus className="size-4" />
              Add Student
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Student" : "Add Student"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this student's details."
              : "Enter the new student's details."}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${formId}-studentNumber`}>Student Number</Label>
              <Input
                id={`${formId}-studentNumber`}
                name="studentNumber"
                defaultValue={student?.studentNumber}
                aria-invalid={!!state.fieldErrors?.studentNumber}
                required
              />
              {state.fieldErrors?.studentNumber ? (
                <p className="text-sm text-destructive">{state.fieldErrors.studentNumber}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${formId}-gender`}>Gender</Label>
              <Select name="gender" defaultValue={student?.gender ?? undefined}>
                <SelectTrigger id={`${formId}-gender`} className="w-full">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${formId}-firstName`}>First Name</Label>
              <Input
                id={`${formId}-firstName`}
                name="firstName"
                defaultValue={student?.firstName}
                aria-invalid={!!state.fieldErrors?.firstName}
                required
              />
              {state.fieldErrors?.firstName ? (
                <p className="text-sm text-destructive">{state.fieldErrors.firstName}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${formId}-lastName`}>Last Name</Label>
              <Input
                id={`${formId}-lastName`}
                name="lastName"
                defaultValue={student?.lastName}
                aria-invalid={!!state.fieldErrors?.lastName}
                required
              />
              {state.fieldErrors?.lastName ? (
                <p className="text-sm text-destructive">{state.fieldErrors.lastName}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-email`}>Email</Label>
            <Input
              id={`${formId}-email`}
              name="email"
              type="email"
              defaultValue={student?.email}
              aria-invalid={!!state.fieldErrors?.email}
              required
            />
            {state.fieldErrors?.email ? (
              <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-phone`}>Phone (optional)</Label>
            <Input
              id={`${formId}-phone`}
              name="phone"
              defaultValue={student?.phone ?? ""}
              aria-invalid={!!state.fieldErrors?.phone}
            />
            {state.fieldErrors?.phone ? (
              <p className="text-sm text-destructive">{state.fieldErrors.phone}</p>
            ) : null}
          </div>
        </form>

        <DialogFooter>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {isEdit ? "Save Changes" : "Add Student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
