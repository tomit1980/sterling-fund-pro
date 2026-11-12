import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** "raised" adds a stronger shadow; "glass" uses the translucent surface. */
  tone?: "default" | "raised" | "glass" | "outline";
  padding?: "none" | "sm" | "md" | "lg";
}

const tones = {
  default: "bg-surface-1 border border-line",
  raised: "bg-surface-2 border border-line shadow-md",
  glass: "glass",
  outline: "border border-line-strong bg-transparent",
};

const paddings = { none: "", sm: "p-4", md: "p-6", lg: "p-8" };

export function Card({ className, tone = "default", padding = "md", ...props }: CardProps) {
  return <div className={cn("min-w-0 rounded-lg", tones[tone], paddings[padding], className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex items-start justify-between gap-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-base font-semibold text-ink-900", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-ink-500", className)} {...props} />;
}
