"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { Loader2, Plus } from "lucide-react";
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
import { createUserAction, type UserFormState } from "@/app/(dashboard)/users/actions";

const initialState: UserFormState = {};

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const [state, formAction, isPending] = useActionState(createUserAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("User created successfully.");
      setOpen(false);
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Add User
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <DialogDescription>Create a new administrator or tutor account.</DialogDescription>
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
            <Input id={`${formId}-name`} name="name" aria-invalid={!!state.fieldErrors?.name} required />
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
              aria-invalid={!!state.fieldErrors?.email}
              required
            />
            {state.fieldErrors?.email ? (
              <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-role`}>Role</Label>
            <Select name="role" defaultValue="TUTOR">
              <SelectTrigger id={`${formId}-role`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TUTOR">Tutor</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
        </form>

        <DialogFooter>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Add User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
