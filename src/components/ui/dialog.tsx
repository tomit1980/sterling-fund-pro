"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Shared behaviour for modal surfaces (Dialog, Sheet): Escape closes, focus is trapped inside the
 * panel and returned to the opener, body scroll is locked while open.
 */
export function useModalBehaviour(open: boolean, onClose: () => void, panelRef: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFirst = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>("[data-autofocus]") ?? panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    };
    const raf = requestAnimationFrame(focusFirst);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open, onClose, panelRef]);
}

const noopSubscribe = () => () => {};

export function Portal({ children }: { children: React.ReactNode }) {
  // false during SSR/hydration, true once on the client: avoids a setState-in-effect round trip.
  const mounted = React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  if (!mounted) return null;
  return createPortal(children, document.body);
}

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, footer, className }: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descId = React.useId();
  useModalBehaviour(open, onClose, panelRef);
  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center" role="presentation">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1}
          className={cn(
            "relative w-full max-w-lg rounded-lg border border-line bg-surface-1 p-6 shadow-lg animate-fade-up focus:outline-none",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-ink-900">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-sm text-ink-500">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 -mt-2 rounded-md p-2 text-ink-500 transition-colors hover:bg-surface-3 hover:text-ink-900"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          {children && <div className="mt-5">{children}</div>}
          {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}
