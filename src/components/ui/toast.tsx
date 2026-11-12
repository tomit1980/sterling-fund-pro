"use client";

import * as React from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastTone = "info" | "success" | "error";

export interface ToastOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: ToastTone;
  /** Auto-dismiss delay in ms. 0 keeps the toast until closed. */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => void;
  dismiss: (id: number) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const icons: Record<ToastTone, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
};

const toneClass: Record<ToastTone, string> = {
  info: "border-accent-500/40 text-accent-500",
  success: "border-up-500/40 text-up-500",
  error: "border-down-500/40 text-down-500",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const counter = React.useRef(0);
  const timers = React.useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = React.useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = React.useCallback(
    (opts: ToastOptions) => {
      const id = ++counter.current;
      setItems((prev) => [...prev.slice(-3), { ...opts, id }]);
      const duration = opts.duration ?? 6000;
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
    },
    [dismiss],
  );

  React.useEffect(() => {
    const current = timers.current;
    return () => current.forEach((t) => clearTimeout(t));
  }, []);

  const ctx = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[80] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
      >
        {items.map((t) => {
          const Icon = icons[t.tone ?? "info"];
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border bg-surface-2 px-4 py-3 text-sm shadow-lg animate-fade-up",
                toneClass[t.tone ?? "info"],
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1 text-ink-700">
                <p className="font-semibold text-ink-900">{t.title}</p>
                {t.description && <p className="mt-0.5 text-ink-500">{t.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="-mr-1 rounded p-1 text-ink-500 transition-colors hover:bg-surface-3 hover:text-ink-900"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
