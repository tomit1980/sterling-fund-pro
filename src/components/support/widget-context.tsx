"use client";

import * as React from "react";

interface SupportWidgetContextValue {
  open: boolean;
  openWidget: () => void;
  closeWidget: () => void;
  toggleWidget: () => void;
}

const SupportWidgetContext = React.createContext<SupportWidgetContextValue | null>(null);

export function SupportWidgetProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const value = React.useMemo<SupportWidgetContextValue>(
    () => ({
      open,
      openWidget: () => setOpen(true),
      closeWidget: () => setOpen(false),
      toggleWidget: () => setOpen((v) => !v),
    }),
    [open],
  );
  return <SupportWidgetContext.Provider value={value}>{children}</SupportWidgetContext.Provider>;
}

export function useSupportWidget() {
  const ctx = React.useContext(SupportWidgetContext);
  if (!ctx) throw new Error("useSupportWidget must be used inside <SupportWidgetProvider>");
  return ctx;
}
