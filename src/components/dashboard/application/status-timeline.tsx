import * as React from "react";
import { Check, CircleX, Clock, FileSearch, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";

export type ApplicationStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "MORE_INFO" | "APPROVED" | "REJECTED";

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  MORE_INFO: "More information needed",
  APPROVED: "Approved",
  REJECTED: "Not approved",
};

const STEPS: Array<{ key: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "DECISION"; label: string }> = [
  { key: "DRAFT", label: "Draft" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "UNDER_REVIEW", label: "Under review" },
  { key: "DECISION", label: "Decision" },
];

function stepIndex(status: ApplicationStatus): number {
  switch (status) {
    case "DRAFT":
      return 0;
    case "SUBMITTED":
      return 1;
    case "UNDER_REVIEW":
    case "MORE_INFO":
      return 2;
    case "APPROVED":
    case "REJECTED":
      return 3;
  }
}

/** Horizontal (vertical on mobile) progress of DRAFT → SUBMITTED → UNDER_REVIEW → decision. */
export function StatusTimeline({ status, className }: { status: ApplicationStatus; className?: string }) {
  const current = stepIndex(status);
  return (
    <ol className={cn("grid gap-3 sm:grid-cols-4", className)} aria-label="Application progress">
      {STEPS.map((step, i) => {
        const done = i < current || (i === current && (status === "APPROVED" || status === "REJECTED"));
        const active = i === current && !done;
        const isDecision = step.key === "DECISION";
        const tone =
          isDecision && status === "REJECTED"
            ? "border-down-500 bg-down-500/15 text-down-500"
            : isDecision && status === "APPROVED"
              ? "border-up-500 bg-up-500/15 text-up-500"
              : done
                ? "border-up-500 bg-up-500/15 text-up-500"
                : active
                  ? "border-brand-500 bg-brand-500/15 text-brand-300"
                  : "border-line-strong bg-surface-2 text-ink-300";
        const Icon = isDecision && status === "REJECTED" ? CircleX : done ? Check : active ? (status === "MORE_INFO" ? FileSearch : status === "SUBMITTED" ? Clock : Hourglass) : Clock;
        let label: string = step.label;
        if (isDecision && (status === "APPROVED" || status === "REJECTED")) label = STATUS_LABEL[status];
        if (step.key === "UNDER_REVIEW" && status === "MORE_INFO") label = STATUS_LABEL.MORE_INFO;
        return (
          <li key={step.key} className="flex items-center gap-3" aria-current={active ? "step" : undefined}>
            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", tone)} aria-hidden>
              <Icon className="h-4 w-4" />
            </span>
            <span className={cn("text-sm", active || done ? "font-medium text-ink-900" : "text-ink-500")}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
