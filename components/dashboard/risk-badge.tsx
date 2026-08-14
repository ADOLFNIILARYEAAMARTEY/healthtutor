import { cn } from "@/lib/utils";
import { RISK_LABELS, type RiskStatus } from "@/lib/calculations/risk";

const RISK_STYLES: Record<RiskStatus, string> = {
  HIGH_RISK: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  ATTENDANCE_RISK:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  ACADEMIC_RISK:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900",
  GOOD_STANDING:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
};

export function RiskBadge({ status }: { status: RiskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        RISK_STYLES[status]
      )}
    >
      {RISK_LABELS[status]}
    </span>
  );
}
