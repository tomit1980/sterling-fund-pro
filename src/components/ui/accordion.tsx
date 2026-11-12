"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  openItems: Set<string>;
  toggle: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** "single" keeps at most one item open; "multiple" allows any number. */
  type?: "single" | "multiple";
  defaultValue?: string | string[];
}

export function Accordion({ type = "single", defaultValue, className, children, ...props }: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(() => {
    if (!defaultValue) return new Set();
    return new Set(Array.isArray(defaultValue) ? defaultValue : [defaultValue]);
  });

  const toggle = React.useCallback(
    (value: string) => {
      setOpenItems((prev) => {
        const next = new Set(type === "single" ? [] : prev);
        if (prev.has(value)) {
          next.delete(value);
        } else {
          next.add(value);
        }
        return next;
      });
    },
    [type],
  );

  const ctx = React.useMemo(() => ({ openItems, toggle }), [openItems, toggle]);

  return (
    <AccordionContext.Provider value={ctx}>
      <div className={cn("divide-y divide-line rounded-lg border border-line bg-surface-1", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps {
  value: string;
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AccordionItem({ value, title, children, className }: AccordionItemProps) {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error("AccordionItem must be used inside <Accordion>");
  const open = ctx.openItems.has(value);
  const id = React.useId();
  const buttonId = `${id}-button`;
  const panelId = `${id}-panel`;

  return (
    <div className={cn("group", className)} data-state={open ? "open" : "closed"}>
      <h3 className="m-0">
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => ctx.toggle(value)}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-medium text-ink-900 transition-colors hover:bg-surface-2/60"
        >
          <span>{title}</span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-500 transition-transform duration-200", open && "rotate-180")} aria-hidden />
        </button>
      </h3>
      <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!open} className="px-5 pb-5 text-sm leading-relaxed text-ink-500">
        {children}
      </div>
    </div>
  );
}
