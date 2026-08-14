"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { Loader2, Pencil, Plus, TriangleAlert } from "lucide-react";
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
  createAssessmentAction,
  updateAssessmentAction,
  type AssessmentFormState,
} from "@/app/(dashboard)/assessments/actions";
import { ASSESSMENT_TYPES } from "@/lib/validation/assessments";
import type { CourseAssessment } from "@/lib/db/assessments";

const initialState: AssessmentFormState = {};

interface AssessmentDialogProps {
  courseId: string;
  assessment?: Pick<CourseAssessment, "id" | "title" | "assessmentType" | "maximumScore" | "weight">;
  /** Sum of weights of the course's other assessments (excludes this one when editing). */
  otherWeightsTotal: number;
}

export function AssessmentDialog({ courseId, assessment, otherWeightsTotal }: AssessmentDialogProps) {
  const isEdit = !!assessment;
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState(assessment?.weight ?? 0);
  const formId = useId();

  const action = isEdit
    ? updateAssessmentAction.bind(null, assessment.id)
    : createAssessmentAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(isEdit ? "Assessment updated successfully." : "Assessment created successfully.");
      setOpen(false);
    }
  }, [state.success, isEdit]);

  const projectedTotal = otherWeightsTotal + (Number.isFinite(weight) ? weight : 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon-sm" aria-label="Edit assessment" title="Edit assessment">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button>
              <Plus className="size-4" />
              Add Assessment
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Assessment" : "Add Assessment"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this assessment's details." : "Create a new assessment for this course."}
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
            <Label htmlFor={`${formId}-title`}>Title</Label>
            <Input
              id={`${formId}-title`}
              name="title"
              defaultValue={assessment?.title}
              aria-invalid={!!state.fieldErrors?.title}
              required
            />
            {state.fieldErrors?.title ? (
              <p className="text-sm text-destructive">{state.fieldErrors.title}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-assessmentType`}>Assessment Type</Label>
            <Select name="assessmentType" defaultValue={assessment?.assessmentType}>
              <SelectTrigger id={`${formId}-assessmentType`} className="w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {ASSESSMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${formId}-maximumScore`}>Maximum Score</Label>
              <Input
                id={`${formId}-maximumScore`}
                name="maximumScore"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={assessment?.maximumScore}
                aria-invalid={!!state.fieldErrors?.maximumScore}
                required
              />
              {state.fieldErrors?.maximumScore ? (
                <p className="text-sm text-destructive">{state.fieldErrors.maximumScore}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${formId}-weight`}>Weight (%)</Label>
              <Input
                id={`${formId}-weight`}
                name="weight"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={assessment?.weight}
                onChange={(e) => setWeight(e.target.valueAsNumber)}
                aria-invalid={!!state.fieldErrors?.weight}
                required
              />
              {state.fieldErrors?.weight ? (
                <p className="text-sm text-destructive">{state.fieldErrors.weight}</p>
              ) : null}
            </div>
          </div>

          {projectedTotal > 100 ? (
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <span>
                This course&apos;s assessment weights will total {projectedTotal}%, which exceeds
                100%. You can still save, but consider adjusting weights.
              </span>
            </div>
          ) : null}
        </form>

        <DialogFooter>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {isEdit ? "Save Changes" : "Add Assessment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
