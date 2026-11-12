"use client";

import { MessageCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useSupportWidget } from "./widget-context";

export function StartChatButton({ children = "Start a chat", ...props }: Omit<ButtonProps, "onClick">) {
  const { openWidget } = useSupportWidget();
  return (
    <Button type="button" onClick={openWidget} {...props}>
      <MessageCircle className="h-4 w-4" aria-hidden />
      {children}
    </Button>
  );
}
