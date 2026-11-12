"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, Select, Textarea } from "@/components/ui/input";
import { applicationReviewSchema } from "@/lib/validation/account";
import { applyFieldErrors, postJson } from "@/components/auth/api-client";

type ReviewInput = z.infer<typeof applicationReviewSchema>;

const OPTIONS: { value: ReviewInput["status"]; label: string; hint: string }[] = [
  { value: "UNDER_REVIEW", label: "Under review", hint: "Acknowledge receipt; the applicant is told a review is in progress." },
  { value: "MORE_INFO", label: "Request more information", hint: "The applicant can edit and resubmit. Use the notes to say what is missing." },
  { value: "APPROVED", label: "Approve", hint: "Final decision. The applicant is notified by email." },
  { value: "REJECTED", label: "Reject", hint: "Final decision. The applicant is notified by email; notes are included." },
];

export function ApplicationReviewForm({ applicationId, currentStatus, currentNotes }: { applicationId: string; currentStatus: string; currentNotes?: string | null }) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState<string | null>(null);
  const form = useForm<ReviewInput>({
    resolver: zodResolver(applicationReviewSchema),
    defaultValues: { status: currentStatus === "SUBMITTED" ? "UNDER_REVIEW" : (currentStatus as ReviewInput["status"]), notes: currentNotes ?? "" },
  });
  const { register, handleSubmit, setError, formState, control } = form;
  const selected = useWatch({ control, name: "status" });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSaved(null);
    const res = await postJson<{ application: { status: string } }>(`/api/admin/applications/${applicationId}/review`, values);
    if (!res.ok) {
      if (!applyFieldErrors(setError, res.error.fieldErrors)) setFormError(res.error.message);
      return;
    }
    setSaved(`Status set to ${res.data.application.status.replaceAll("_", " ")}. The applicant has been emailed.`);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && <Alert tone="error">{formError}</Alert>}
      {saved && <Alert tone="success">{saved}</Alert>}
      <FormField label="Decision" htmlFor="status" error={formState.errors.status?.message} hint={OPTIONS.find((o) => o.value === selected)?.hint}>
        <Select id="status" {...register("status")}>
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Notes to applicant" htmlFor="notes" error={formState.errors.notes?.message} hint="Optional, up to 2000 characters. Included in the notification email.">
        <Textarea id="notes" rows={5} {...register("notes")} />
      </FormField>
      <Button type="submit" variant={selected === "REJECTED" ? "danger" : "primary"} loading={formState.isSubmitting}>
        Save decision
      </Button>
    </form>
  );
}
