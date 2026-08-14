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
  createTutorAction,
  updateTutorAction,
  type TutorFormState,
} from "@/app/(dashboard)/tutors/actions";
import type { TutorWithStats } from "@/lib/db/tutors";

const initialState: TutorFormState = {};

export function TutorDialog({ tutor }: { tutor?: Pick<TutorWithStats, "id" | "name" | "email"> }) {
  const isEdit = !!tutor;
  const [open, setOpen] = useState(false);
  const formId = useId();

  const action = isEdit ? updateTutorAction.bind(null, tutor.id) : createTutorAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(isEdit ? "Tutor updated successfully." : "Tutor created successfully.");
      setOpen(false);
    }
  }, [state.success, isEdit]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon-sm" aria-label="Edit tutor" title="Edit tutor">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button>
              <Plus className="size-4" />
              Add Tutor
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Tutor" : "Add Tutor"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this tutor's details." : "Create a new tutor account."}
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
            <Label htmlFor={`${formId}-name`}>Full Name</Label>
            <Input
              id={`${formId}-name`}
              name="name"
              defaultValue={tutor?.name}
              aria-invalid={!!state.fieldErrors?.name}
              required
            />
            {state.fieldErrors?.name ? (
              <p className="text-sm text-destructive">{state.fieldErrors.name}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-email`}>Email</Label>
            <Input
              id={`${formId}-email`}
              name="email"
              type="email"
              defaultValue={tutor?.email}
              aria-invalid={!!state.fieldErrors?.email}
              required
            />
            {state.fieldErrors?.email ? (
              <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
            ) : null}
          </div>

          {!isEdit ? (
            <div className="space-y-2">
              <Label htmlFor={`${formId}-password`}>Temporary Password</Label>
              <Input
                id={`${formId}-password`}
                name="password"
                type="password"
                aria-invalid={!!state.fieldErrors?.password}
                required
              />
              {state.fieldErrors?.password ? (
                <p className="text-sm text-destructive">{state.fieldErrors.password}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  At least 8 characters, including an uppercase letter and a number.
                </p>
              )}
            </div>
          ) : null}
        </form>

        <DialogFooter>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {isEdit ? "Save Changes" : "Add Tutor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
