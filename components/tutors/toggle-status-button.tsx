"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleTutorStatusAction } from "@/app/(dashboard)/tutors/actions";

export function EnableTutorButton({ tutorId }: { tutorId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleTutorStatusAction(tutorId, true);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Tutor enabled successfully.");
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
      Enable
    </Button>
  );
}
