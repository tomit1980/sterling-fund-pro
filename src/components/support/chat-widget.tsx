"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { MessageCircle, Send, X } from "lucide-react";
import { chatMessageSchema, chatStartSchema } from "@/lib/validation/support";
import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useSupportStatus } from "./use-support-status";
import { useSupportWidget } from "./widget-context";

/* ---------- API contract (implemented by the backend agent) ---------- */

export type ChatSender = "USER" | "GUEST" | "AGENT" | "SYSTEM";

export interface ChatMessage {
  id: string;
  senderType: ChatSender;
  body: string;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  status: string;
}

interface ConversationPayload {
  conversation: ChatConversation;
  messages: ChatMessage[];
}

interface ApiEnvelope<T> {
  ok?: boolean;
  data?: T;
  error?: { code?: string; message?: string; fieldErrors?: Record<string, string | string[]> };
}

type StartInput = z.input<typeof chatStartSchema>;
type StartOutput = z.output<typeof chatStartSchema>;
type MessageInput = z.input<typeof chatMessageSchema>;
type MessageOutput = z.output<typeof chatMessageSchema>;

const POLL_MS = 5000;

async function fetchJson<T>(input: string, init?: RequestInit): Promise<{ status: number; json: ApiEnvelope<T> | null }> {
  const res = await fetch(input, { ...init, headers: { Accept: "application/json", ...(init?.headers ?? {}) }, cache: "no-store" });
  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  return { status: res.status, json };
}

/* ---------- Launcher + panel ---------- */

export function SupportChatWidget() {
  const { open, openWidget, closeWidget } = useSupportWidget();
  const { status } = useSupportStatus(open ? 15_000 : 60_000);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const launcherRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeWidget();
        launcherRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeWidget]);

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="Support chat"
          data-testid="chat-panel"
          className="fixed inset-x-3 bottom-20 z-[60] flex max-h-[min(36rem,calc(100dvh-6rem))] flex-col overflow-hidden rounded-lg border border-line bg-surface-1 shadow-lg animate-fade-up sm:inset-x-auto sm:right-5 sm:w-[24rem]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">Support</p>
              <p className="flex items-center gap-1.5 truncate text-xs text-ink-500" data-testid="chat-status">
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", status.online ? "bg-up-500" : "bg-ink-300")} aria-hidden />
                {status.online ? "Online — an agent is available" : "Offline — leave a message, we reply by email"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                closeWidget();
                launcherRef.current?.focus();
              }}
              className="rounded-md p-2 text-ink-500 transition-colors hover:bg-surface-3 hover:text-ink-900"
              aria-label="Close support chat"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <ChatBody online={status.online} />
        </div>
      )}

      <button
        ref={launcherRef}
        type="button"
        onClick={() => (open ? closeWidget() : openWidget())}
        aria-expanded={open}
        aria-label={open ? "Close support chat" : "Open support chat"}
        data-testid="chat-launcher"
        className="fixed bottom-5 right-5 z-[60] inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-[#1a1304] shadow-[0_12px_32px_-10px_rgba(212,162,51,0.7)] transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-6 w-6" aria-hidden /> : <MessageCircle className="h-6 w-6" aria-hidden />}
        <span
          className={cn("absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-surface-0", status.online ? "bg-up-500" : "bg-ink-300")}
          aria-hidden
        />
      </button>
    </>
  );
}

/* ---------- Conversation state machine ---------- */

type Phase = "loading" | "start" | "chat" | "error";

function ChatBody({ online }: { online: boolean }) {
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [conversation, setConversation] = React.useState<ChatConversation | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const applyPayload = React.useCallback((d: ConversationPayload | undefined) => {
    if (!d?.conversation) return false;
    setConversation(d.conversation);
    setMessages(Array.isArray(d.messages) ? d.messages : []);
    return true;
  }, []);

  const loadCurrent = React.useCallback(async () => {
    try {
      const { status, json } = await fetchJson<ConversationPayload>("/api/support/conversations/current");
      if (status === 404) {
        setPhase("start");
        return;
      }
      if (status >= 200 && status < 300 && json?.ok && applyPayload(json.data)) {
        setPhase("chat");
        setError(null);
        return;
      }
      setPhase((p) => (p === "chat" ? "chat" : "start"));
    } catch {
      setPhase((p) => (p === "chat" ? "chat" : "start"));
      setError((e) => e ?? "We could not reach the support service. You can still leave a message.");
    }
  }, [applyPayload]);

  // Initial load (next tick) + 5 s polling while the panel is open.
  React.useEffect(() => {
    const first = setTimeout(() => void loadCurrent(), 0);
    const t = setInterval(() => void loadCurrent(), POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [loadCurrent]);

  if (phase === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-ink-500" aria-busy="true">
        Loading…
      </div>
    );
  }

  if (phase === "chat" && conversation) {
    return (
      <>
        <MessageList messages={messages} online={online} conversation={conversation} />
        <Composer
          disabled={conversation.status === "CLOSED"}
          onSent={(m) => {
            setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          }}
          onError={setError}
        />
        {error && (
          <p className="border-t border-line px-4 py-2 text-xs text-down-500" role="alert">
            {error}
          </p>
        )}
      </>
    );
  }

  return (
    <StartForm
      online={online}
      error={error}
      onStarted={(payload) => {
        if (applyPayload(payload)) {
          setError(null);
          setPhase("chat");
        }
      }}
      onError={setError}
    />
  );
}

/* ---------- Start form ---------- */

function StartForm({
  online,
  error,
  onStarted,
  onError,
}: {
  online: boolean;
  error: string | null;
  onStarted: (p: ConversationPayload) => void;
  onError: (msg: string | null) => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StartInput, unknown, StartOutput>({
    resolver: zodResolver(chatStartSchema),
    defaultValues: { name: "", email: "", message: "", company_url: "" },
    mode: "onTouched",
  });

  const onSubmit = async (values: StartOutput) => {
    onError(null);
    const body: StartOutput = { ...values };
    if (!body.name) delete body.name;
    if (!body.email) delete body.email;
    try {
      const { status, json } = await fetchJson<ConversationPayload>("/api/support/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (status >= 200 && status < 300 && json?.ok && json.data) {
        onStarted(json.data);
        return;
      }
      const fe = json?.error?.fieldErrors;
      if (fe) {
        for (const [k, v] of Object.entries(fe)) {
          if (k === "name" || k === "email" || k === "message") setError(k, { type: "server", message: Array.isArray(v) ? v[0] : v });
        }
      }
      onError(json?.error?.message ?? (status === 429 ? "Too many requests. Please wait a moment and try again." : "We could not start the chat. Please try again."));
    } catch {
      onError("Network error. Please try again or use the contact form.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-1 flex-col gap-4 overflow-y-auto p-4" data-testid="chat-start-form">
      <p className="text-sm text-ink-700">
        {online
          ? "An agent is online. Tell us who you are and how we can help."
          : "Support is offline right now. Leave a message and we reply by email during support hours."}
      </p>
      {error && <Alert tone="warning">{error}</Alert>}
      <FormField label="Name" htmlFor="chat-name" error={errors.name?.message}>
        <Input id="chat-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} data-autofocus />
      </FormField>
      <FormField label="Email" htmlFor="chat-email" error={errors.email?.message} hint={online ? undefined : "Required so we can reply while offline."}>
        <Input id="chat-email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
      </FormField>
      <FormField label="Message" htmlFor="chat-message" error={errors.message?.message} required>
        <Textarea id="chat-message" rows={3} className="min-h-20" aria-invalid={!!errors.message} {...register("message")} />
      </FormField>
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
        <label htmlFor="chat-company-url">Company website</label>
        <input id="chat-company-url" type="text" tabIndex={-1} autoComplete="off" {...register("company_url")} />
      </div>
      <Button type="submit" loading={isSubmitting} className="mt-auto">
        {online ? "Start chat" : "Leave a message"}
      </Button>
    </form>
  );
}

/* ---------- Message list ---------- */

function MessageList({ messages, online, conversation }: { messages: ChatMessage[]; online: boolean; conversation: ChatConversation }) {
  const endRef = React.useRef<HTMLDivElement>(null);
  const count = messages.length;
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [count]);

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-live="polite" aria-relevant="additions" data-testid="chat-messages">
      {!online && (
        <p className="rounded-md border border-line bg-surface-2 px-3 py-2 text-xs text-ink-500">
          No agent is online. Your messages are saved and answered by email.
        </p>
      )}
      {messages.map((m) => {
        const mine = m.senderType === "USER" || m.senderType === "GUEST";
        const system = m.senderType === "SYSTEM";
        return (
          <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                system
                  ? "w-full bg-transparent text-center text-xs text-ink-500"
                  : mine
                    ? "bg-brand-500/20 text-ink-900"
                    : "border border-line bg-surface-2 text-ink-900",
              )}
            >
              {!system && !mine && <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-300">Support</p>}
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              {!system && (
                <time dateTime={m.createdAt} className="mt-1 block text-[11px] text-ink-500">
                  {formatTime(m.createdAt)}
                </time>
              )}
            </div>
          </div>
        );
      })}
      {conversation.status === "CLOSED" && <p className="text-center text-xs text-ink-500">This conversation is closed. Start a new one any time.</p>}
      <div ref={endRef} />
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/* ---------- Composer ---------- */

function Composer({ disabled, onSent, onError }: { disabled?: boolean; onSent: (m: ChatMessage) => void; onError: (msg: string | null) => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MessageInput, unknown, MessageOutput>({ resolver: zodResolver(chatMessageSchema), defaultValues: { body: "" } });

  const onSubmit = async (values: MessageOutput) => {
    onError(null);
    try {
      const { status, json } = await fetchJson<{ message: ChatMessage }>("/api/support/conversations/current/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (status >= 200 && status < 300 && json?.ok && json.data?.message) {
        onSent(json.data.message);
        reset();
        return;
      }
      onError(json?.error?.message ?? "Your message was not sent. Please try again.");
    } catch {
      onError("Network error. Your message was not sent.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex items-end gap-2 border-t border-line p-3" data-testid="chat-composer">
      <label htmlFor="chat-composer" className="sr-only">
        Message
      </label>
      <Textarea
        id="chat-composer"
        rows={1}
        className="min-h-11 max-h-32 resize-none py-2.5"
        placeholder={disabled ? "Conversation closed" : "Type a message…"}
        disabled={disabled}
        aria-invalid={!!errors.body}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSubmit(onSubmit)();
          }
        }}
        {...register("body")}
      />
      <Button type="submit" size="icon" aria-label="Send message" disabled={disabled} loading={isSubmitting}>
        {!isSubmitting && <Send className="h-4 w-4" aria-hidden />}
      </Button>
    </form>
  );
}
