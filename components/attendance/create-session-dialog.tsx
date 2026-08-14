"use client";

import { useActionState, useId, useState } from "react";
import { Loader2, Plus } from "lucide-react";

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
import { createSessionAction, type SessionFormState } from "@/app/(dashboard)/attendance/actions";

const initialState: SessionFormState = {};

export function CreateSessionDialog({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const [state, formAction, isPending] = useActionState(createSessionAction, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <Plus className="size-4" />
            New Session
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Class Session</DialogTitle>
          <DialogDescription>
            Add a new session for this course, then mark attendance.
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
          <input type="hidden" name="courseId" value={courseId} />
          <div className="space-y-2">
            <Label htmlFor={`${formId}-sessionDate`}>Date</Label>
            <Input
              id={`${formId}-sessionDate`}
              name="sessionDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              aria-invalid={!!state.fieldErrors?.sessionDate}
              required
            />
            {state.fieldErrors?.sessionDate ? (
              <p className="text-sm text-destructive">{state.fieldErrors.sessionDate}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-topic`}>Topic (optional)</Label>
            <Input id={`${formId}-topic`} name="topic" placeholder="e.g. Core Concepts I" />
          </div>
        </form>

        <DialogFooter>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Create Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
