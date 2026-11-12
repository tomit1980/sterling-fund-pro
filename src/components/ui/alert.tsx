import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertTone = "info" | "success" | "warning" | "error";

const styles: Record<AlertTone, { box: string; Icon: React.ComponentType<{ className?: string }> }> = {
  info: { box: "border-accent-500/30 bg-accent-500/10 text-ink-700", Icon: Info },
  success: { box: "border-up-500/30 bg-up-500/10 text-ink-700", Icon: CheckCircle2 },
  warning: { box: "border-warn-500/30 bg-warn-500/10 text-ink-700", Icon: AlertTriangle },
  error: { box: "border-down-500/30 bg-down-500/10 text-ink-700", Icon: XCircle },
};

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: AlertTone;
  title?: React.ReactNode;
}

export function Alert({ tone = "info", title, className, children, ...props }: AlertProps) {
  const { box, Icon } = styles[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-md border px-4 py-3 text-sm", box, className)} {...props}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        {title && <p className="font-semibold text-ink-900">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}
