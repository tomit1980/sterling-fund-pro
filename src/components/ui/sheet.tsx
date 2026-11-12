"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Portal, useModalBehaviour } from "./dialog";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  side?: "left" | "right";
  children: React.ReactNode;
  className?: string;
}

/** Slide-in side panel (used for the mobile navigation). */
export function Sheet({ open, onClose, title, side = "right", children, className }: SheetProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  useModalBehaviour(open, onClose, panelRef);
  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[70]" role="presentation">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          data-testid="sheet"
          className={cn(
            "absolute inset-y-0 flex w-[min(100%,22rem)] flex-col border-line bg-surface-1 shadow-lg focus:outline-none",
            side === "right" ? "right-0 border-l" : "left-0 border-r",
            className,
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 id={titleId} className="text-base font-semibold text-ink-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-ink-500 transition-colors hover:bg-surface-3 hover:text-ink-900"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </Portal>
  );
}
