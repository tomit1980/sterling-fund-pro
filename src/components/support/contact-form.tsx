"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { contactFormSchema, SUPPORT_TOPICS } from "@/lib/validation/support";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type FormInput = z.input<typeof contactFormSchema>;
type FormOutput = z.output<typeof contactFormSchema>;

interface ApiError {
  code?: string;
  message?: string;
  fieldErrors?: Record<string, string | string[]>;
}

export interface ContactFormProps {
  defaultTopic?: string;
  className?: string;
  /** Called after a successful submission with the created id. */
  onSuccess?: (id: string) => void;
}

const topicValues = SUPPORT_TOPICS.map((t) => t.value) as string[];

export function ContactForm({ defaultTopic, className, onSuccess }: ContactFormProps) {
  // Set after mount (not during render) so the elapsed-time bot check measures real user time.
  const mountedAt = React.useRef<number | null>(null);
  React.useEffect(() => {
    mountedAt.current = Date.now();
  }, []);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submittedId, setSubmittedId] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      topic: defaultTopic && topicValues.includes(defaultTopic) ? defaultTopic : "general",
      subject: "",
      message: "",
      company_url: "",
    },
    mode: "onTouched",
  });

  const onSubmit = async (values: FormOutput) => {
    setServerError(null);
    const now = Date.now();
    const payload = { ...values, elapsedMs: Math.max(0, now - (mountedAt.current ?? now)) };
    try {
      const res = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; data?: { id?: string }; error?: ApiError } | null;
      if (res.ok && json?.ok) {
        const id = json.data?.id ?? "";
        setSubmittedId(id || "sent");
        onSuccess?.(id);
        reset();
        mountedAt.current = Date.now();
        return;
      }
      const err = json?.error;
      if (err?.fieldErrors) {
        for (const [field, msg] of Object.entries(err.fieldErrors)) {
          const message = Array.isArray(msg) ? msg[0] : msg;
          if (field in values) setError(field as keyof FormInput, { type: "server", message });
        }
      }
      setServerError(
        err?.message ??
          (res.status === 429 ? "Too many messages from this connection. Please try again in a few minutes." : "We could not send your message. Please try again."),
      );
    } catch {
      setServerError("Network error. Check your connection and try again, or email us directly.");
    }
  };

  if (submittedId) {
    return (
      <div role="status" className={cn("rounded-lg border border-up-500/30 bg-up-500/10 p-6", className)} data-testid="contact-success">
        <CheckCircle2 className="h-6 w-6 text-up-500" aria-hidden />
        <h3 className="mt-3 text-lg font-semibold text-ink-900">Message received</h3>
        <p className="mt-1 text-sm text-ink-700">
          Thank you. We reply by email during support hours.
          {submittedId !== "sent" && (
            <>
              {" "}
              Your reference is <span className="font-mono text-ink-900">{submittedId}</span>.
            </>
          )}
        </p>
        <Button variant="secondary" size="sm" className="mt-5" onClick={() => setSubmittedId(null)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate className={cn("space-y-5", className)} data-testid="contact-form">
      {serverError && <Alert tone="error">{serverError}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="contact-name" error={errors.name?.message} required>
          <Input id="contact-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
        </FormField>
        <FormField label="Email" htmlFor="contact-email" error={errors.email?.message} required>
          <Input id="contact-email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} {...register("email")} />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Topic" htmlFor="contact-topic" error={errors.topic?.message}>
          <Select id="contact-topic" aria-invalid={!!errors.topic} {...register("topic")}>
            {SUPPORT_TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Subject" htmlFor="contact-subject" error={errors.subject?.message} required>
          <Input id="contact-subject" aria-invalid={!!errors.subject} {...register("subject")} />
        </FormField>
      </div>

      <FormField label="Message" htmlFor="contact-message" error={errors.message?.message} hint="Do not include passwords or full card numbers." required>
        <Textarea id="contact-message" rows={6} aria-invalid={!!errors.message} {...register("message")} />
      </FormField>

      {/* Honeypot: hidden from people, filled by bots. */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
        <label htmlFor="contact-company-url">Company website</label>
        <input id="contact-company-url" type="text" tabIndex={-1} autoComplete="off" {...register("company_url")} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-500">By sending this form you agree to our Privacy Policy. We do not use your message for marketing.</p>
        <Button type="submit" loading={isSubmitting} className="sm:min-w-40">
          Send message
        </Button>
      </div>
    </form>
  );
}
