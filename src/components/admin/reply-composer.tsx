"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, Select, Textarea } from "@/components/ui/input";
import { agentReplySchema } from "@/lib/validation/support";
import { applyFieldErrors, postJson } from "@/components/auth/api-client";

type ReplyInput = z.infer<typeof agentReplySchema>;

export function ReplyComposer({ conversationId, status, hasEmail }: { conversationId: string; status: "OPEN" | "PENDING" | "CLOSED"; hasEmail: boolean }) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [closing, setClosing] = React.useState(false);
  const form = useForm<ReplyInput>({ resolver: zodResolver(agentReplySchema), defaultValues: { body: "", status: "PENDING" } });
  const { register, handleSubmit, setError, formState, reset } = form;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setInfo(null);
    const res = await postJson<{ emailed: boolean }>(`/api/admin/support/${conversationId}/reply`, values);
    if (!res.ok) {
      if (!applyFieldErrors(setError, res.error.fieldErrors)) setFormError(res.error.message);
      return;
    }
    reset({ body: "", status: values.status });
    setInfo(res.data.emailed ? "Reply sent and emailed to the contact." : "Reply posted to the chat.");
    router.refresh();
  });

  async function close() {
    setClosing(true);
    setFormError(null);
    const res = await postJson(`/api/admin/support/${conversationId}/close`, {});
    setClosing(false);
    if (!res.ok) {
      setFormError(res.error.message);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      {status === "CLOSED" && <Alert tone="info">This conversation is closed. Replying will reopen it.</Alert>}
      {formError && <Alert tone="error">{formError}</Alert>}
      {info && <Alert tone="success">{info}</Alert>}
      <FormField
        label="Reply"
        htmlFor="body"
        error={formState.errors.body?.message}
        hint={hasEmail ? "The contact will also receive this reply by email." : "No email on file; the reply only appears in the chat."}
      >
        <Textarea id="body" rows={5} placeholder="Write your reply…" {...register("body")} />
      </FormField>
      <div className="flex flex-wrap items-center gap-3">
        <Select aria-label="Status after reply" className="h-10 w-48 text-sm" {...register("status")}>
          <option value="PENDING">Mark as pending</option>
          <option value="OPEN">Keep open</option>
          <option value="CLOSED">Reply and close</option>
        </Select>
        <Button type="submit" loading={formState.isSubmitting}>
          Send reply
        </Button>
        {status !== "CLOSED" && (
          <Button type="button" variant="outline" onClick={close} loading={closing}>
            Close without reply
          </Button>
        )}
      </div>
    </form>
  );
}
