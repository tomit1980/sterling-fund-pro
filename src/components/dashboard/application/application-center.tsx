"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Landmark, User } from "lucide-react";
import { Alert, Badge, Button, Card, CardDescription, CardHeader, CardTitle, Skeleton, useToast } from "@/components/ui";
import { cn, formatDateTime } from "@/lib/utils";
import { apiFetch } from "../api-client";
import { ApplicationForm, type ApplicationRecord, type ApplicationType } from "./application-form";
import { STATUS_LABEL, StatusTimeline } from "./status-timeline";

const TYPES: Array<{ value: ApplicationType; label: string; blurb: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: "INDIVIDUAL", label: "Individual", blurb: "Personal trading account in your own name.", icon: User },
  { value: "CORPORATE", label: "Corporate", blurb: "Company, trust or partnership with authorised representatives.", icon: Building2 },
  { value: "SMSF", label: "SMSF", blurb: "Self-managed super fund with individual or corporate trustees.", icon: Landmark },
];

function isType(v: string | null): v is ApplicationType {
  return v === "INDIVIDUAL" || v === "CORPORATE" || v === "SMSF";
}

/** /dashboard/application body: loads the current application, shows its status, or the typed form. */
export function ApplicationCenter() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [app, setApp] = React.useState<ApplicationRecord | null | undefined>(undefined);
  const [error, setError] = React.useState<string | null>(null);
  const queryType = params.get("type")?.toUpperCase() ?? null;
  const [type, setType] = React.useState<ApplicationType>(isType(queryType) ? queryType : "INDIVIDUAL");
  const [startNew, setStartNew] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    apiFetch<{ application: ApplicationRecord | null }>("/api/account/application")
      .then((d) => {
        if (cancelled) return;
        setApp(d.application);
        if (d.application && !isType(queryType)) setType(d.application.type);
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : "Could not load your application"));
    return () => {
      cancelled = true;
    };
  }, [queryType]);

  const chooseType = (t: ApplicationType) => {
    setType(t);
    router.replace(`/dashboard/application?type=${t}`, { scroll: false });
  };

  const onSubmitted = (record: ApplicationRecord) => {
    setApp(record);
    setStartNew(false);
    toast({ title: "Application submitted", description: "We will email you when the review progresses.", tone: "success" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) return <Alert tone="error">{error}</Alert>;
  if (app === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const showForm = !app || startNew || app.status === "DRAFT" || app.status === "MORE_INFO" || (app.status === "REJECTED" && startNew);
  const canResubmit = app && (app.status === "DRAFT" || app.status === "MORE_INFO");

  return (
    <div className="space-y-6" data-testid="application-center">
      {app && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Application status</CardTitle>
              <CardDescription>
                {TYPES.find((t) => t.value === app.type)?.label} account · ref <span className="font-mono text-ink-700">{app.id.slice(-8).toUpperCase()}</span>
              </CardDescription>
            </div>
            <Badge tone={app.status === "APPROVED" ? "up" : app.status === "REJECTED" ? "down" : app.status === "MORE_INFO" ? "warn" : "info"} dot>
              {STATUS_LABEL[app.status]}
            </Badge>
          </CardHeader>
          <StatusTimeline status={app.status} />
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-ink-500">Submitted</dt>
              <dd className="text-ink-900">{app.submittedAt ? formatDateTime(app.submittedAt) : "Not yet"}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Decision</dt>
              <dd className="text-ink-900">{app.decisionAt ? formatDateTime(app.decisionAt) : "Pending"}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Last updated</dt>
              <dd className="text-ink-900">{app.updatedAt ? formatDateTime(app.updatedAt) : "—"}</dd>
            </div>
          </dl>
          {app.reviewNotes && (
            <Alert tone={app.status === "REJECTED" ? "error" : "warning"} title="Message from our review team" className="mt-4">
              {app.reviewNotes}
            </Alert>
          )}
          {app.status === "APPROVED" && (
            <Alert tone="success" className="mt-4">
              Your application is approved. Identity verification and funding are completed separately with our approved providers before live trading is enabled.
            </Alert>
          )}
          {(app.status === "SUBMITTED" || app.status === "UNDER_REVIEW") && (
            <p className="mt-4 text-sm text-ink-500">Our team is reviewing your application. You will be emailed when there is an update; nothing further is needed from you right now.</p>
          )}
          {app.status === "REJECTED" && !startNew && (
            <Button type="button" variant="outline" className="mt-4" onClick={() => setStartNew(true)}>
              Start a new application
            </Button>
          )}
        </Card>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{canResubmit ? "Update and resubmit your application" : "Apply for an account"}</CardTitle>
              <CardDescription>
                {canResubmit
                  ? "Review the notes above, update your answers and resubmit."
                  : "Choose the account type that matches how you will trade. All answers are structured declarations; no documents are uploaded here."}
              </CardDescription>
            </div>
          </CardHeader>
          {!canResubmit && (
            <div className="mb-6 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Account type">
              {TYPES.map((t) => {
                const Icon = t.icon;
                const selected = type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => chooseType(t.value)}
                    className={cn(
                      "rounded-lg border p-4 text-left transition-colors",
                      selected ? "border-brand-500 bg-brand-500/10" : "border-line hover:border-line-strong hover:bg-surface-2",
                    )}
                  >
                    <Icon className={cn("mb-2 h-5 w-5", selected ? "text-brand-400" : "text-ink-500")} aria-hidden />
                    <p className="font-medium text-ink-900">{t.label}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{t.blurb}</p>
                  </button>
                );
              })}
            </div>
          )}
          <ApplicationForm key={canResubmit ? app.id : type} type={canResubmit ? app.type : type} initial={canResubmit ? app.data : undefined} onSubmitted={onSubmitted} />
        </Card>
      )}
    </div>
  );
}
