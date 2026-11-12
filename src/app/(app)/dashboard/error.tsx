"use client";

import * as React from "react";
import Link from "next/link";
import { Alert, Button, ButtonLink } from "@/components/ui";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error("[dashboard] render error", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl space-y-4 py-10">
      <Alert tone="error" title="Something went wrong loading this page">
        The dashboard could not be rendered. This is usually temporary; try again or go back to the overview.
        {error.digest && <span className="mt-2 block font-mono text-xs text-ink-500">Ref: {error.digest}</span>}
      </Alert>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/dashboard" variant="outline">
          Back to overview
        </ButtonLink>
        <Link href="/support" className="inline-flex items-center text-sm text-brand-400 hover:underline">
          Contact support
        </Link>
      </div>
    </div>
  );
}
