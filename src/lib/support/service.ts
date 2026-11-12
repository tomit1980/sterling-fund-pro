/**
 * Support conversations (contact form + live chat). Route handlers only deal with cookies and
 * sessions; every DB rule lives here so it can be tested.
 */
import type { ConversationStatus, Prisma, SenderType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { randomToken, sha256 } from "@/lib/auth/crypto";
import { env } from "@/lib/env";
import { sendEmail, templates } from "@/lib/email";
import { SUPPORT_TOPICS, type ChatStartInput, type ContactFormInput } from "@/lib/validation/support";

export const CHAT_COOKIE = "sfp_chat";
export const CHAT_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const conversationInclude = {
  messages: { orderBy: { createdAt: "asc" as const }, take: 200 },
} satisfies Prisma.SupportConversationInclude;

type ConversationWithMessages = Prisma.SupportConversationGetPayload<{ include: typeof conversationInclude }>;

export interface SerializedMessage {
  id: string;
  senderType: SenderType;
  body: string;
  createdAt: string;
}

export interface SerializedConversation {
  id: string;
  channel: "CONTACT_FORM" | "LIVE_CHAT";
  status: ConversationStatus;
  subject: string;
  topic: string | null;
  createdAt: string;
  lastMessageAt: string;
  closedAt: string | null;
  messages: SerializedMessage[];
}

export function serializeConversation(c: ConversationWithMessages): SerializedConversation {
  return {
    id: c.id,
    channel: c.channel,
    status: c.status,
    subject: c.subject,
    topic: c.topic,
    createdAt: c.createdAt.toISOString(),
    lastMessageAt: c.lastMessageAt.toISOString(),
    closedAt: c.closedAt?.toISOString() ?? null,
    messages: c.messages.map((m) => ({ id: m.id, senderType: m.senderType, body: m.body, createdAt: m.createdAt.toISOString() })),
  };
}

export function topicLabel(topic?: string | null): string {
  return SUPPORT_TOPICS.find((t) => t.value === topic)?.label ?? "General enquiry";
}

/** Identity of the visitor: a logged-in user or the raw `sfp_chat` cookie value. */
export interface ChatIdentity {
  user?: { id: string; name: string; email: string } | null;
  guestToken?: string | null;
}

function identityWhere(identity: ChatIdentity): Prisma.SupportConversationWhereInput | null {
  if (identity.user) return { userId: identity.user.id, channel: "LIVE_CHAT" };
  if (identity.guestToken) return { guestTokenHash: sha256(identity.guestToken), channel: "LIVE_CHAT" };
  return null;
}

export async function findCurrentConversation(identity: ChatIdentity): Promise<ConversationWithMessages | null> {
  const where = identityWhere(identity);
  if (!where) return null;
  return prisma.supportConversation.findFirst({
    where: { ...where, status: { not: "CLOSED" } },
    orderBy: { lastMessageAt: "desc" },
    include: conversationInclude,
  });
}

export interface StartChatResult {
  conversation: ConversationWithMessages;
  /** Raw cookie value to set for guests (undefined for logged-in users or when reusing a cookie). */
  guestToken?: string;
  reused: boolean;
}

/**
 * Start a live chat. A logged-in user (or a guest with a valid cookie) who already has an open
 * conversation simply gets their message appended to it.
 */
export async function startChat(input: ChatStartInput, identity: ChatIdentity, meta: { ip?: string | null } = {}): Promise<StartChatResult> {
  const existing = await findCurrentConversation(identity);
  if (existing) {
    const conversation = await appendMessage(existing.id, identity.user ? "USER" : "GUEST", identity.user?.id ?? null, input.message);
    await audit({ actorUserId: identity.user?.id, action: "support.chat.message", targetType: "SupportConversation", targetId: existing.id, ip: meta.ip });
    return { conversation, reused: true };
  }

  const guestToken = identity.user ? undefined : randomToken(32);
  const subject = input.topic ? `Live chat · ${topicLabel(input.topic)}` : "Live chat";
  const conversation = await prisma.supportConversation.create({
    data: {
      channel: "LIVE_CHAT",
      status: "OPEN",
      subject,
      topic: input.topic ?? null,
      userId: identity.user?.id ?? null,
      guestName: identity.user ? null : (input.name ?? null),
      guestEmail: identity.user ? null : (input.email ?? null),
      guestTokenHash: guestToken ? sha256(guestToken) : null,
      messages: {
        create: {
          senderType: identity.user ? "USER" : "GUEST",
          senderUserId: identity.user?.id ?? null,
          body: input.message,
        },
      },
    },
    include: conversationInclude,
  });
  await audit({ actorUserId: identity.user?.id, action: "support.chat.start", targetType: "SupportConversation", targetId: conversation.id, ip: meta.ip });
  return { conversation, guestToken, reused: false };
}

export class ConversationClosedError extends Error {
  constructor() {
    super("This conversation is closed");
  }
}

export async function appendMessage(
  conversationId: string,
  senderType: SenderType,
  senderUserId: string | null,
  body: string,
  statusAfter?: ConversationStatus,
): Promise<ConversationWithMessages> {
  const now = new Date();
  const nextStatus: ConversationStatus = statusAfter ?? (senderType === "AGENT" ? "PENDING" : "OPEN");
  return prisma.supportConversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: now,
      status: nextStatus,
      closedAt: nextStatus === "CLOSED" ? now : null,
      messages: { create: { senderType, senderUserId, body } },
    },
    include: conversationInclude,
  });
}

/** Visitor posts to their current conversation. Throws ConversationClosedError / returns null when none. */
export async function postVisitorMessage(identity: ChatIdentity, body: string, meta: { ip?: string | null } = {}): Promise<ConversationWithMessages | null> {
  const current = await findCurrentConversation(identity);
  if (!current) return null;
  if (current.status === "CLOSED") throw new ConversationClosedError();
  const updated = await appendMessage(current.id, identity.user ? "USER" : "GUEST", identity.user?.id ?? null, body);
  await audit({ actorUserId: identity.user?.id, action: "support.chat.message", targetType: "SupportConversation", targetId: current.id, ip: meta.ip });
  return updated;
}

/** Contact form → CONTACT_FORM conversation + acknowledgement email (+ optional internal notification). */
export async function submitContactForm(
  input: ContactFormInput,
  identity: { user?: { id: string } | null },
  meta: { ip?: string | null } = {},
): Promise<ConversationWithMessages> {
  const conversation = await prisma.supportConversation.create({
    data: {
      channel: "CONTACT_FORM",
      status: "OPEN",
      subject: input.subject,
      topic: input.topic,
      userId: identity.user?.id ?? null,
      guestName: input.name,
      guestEmail: input.email,
      messages: {
        create: {
          senderType: identity.user ? "USER" : "GUEST",
          senderUserId: identity.user?.id ?? null,
          body: input.message,
        },
      },
    },
    include: conversationInclude,
  });
  await audit({ actorUserId: identity.user?.id, action: "support.contact", targetType: "SupportConversation", targetId: conversation.id, ip: meta.ip, metadata: { topic: input.topic } });

  await sendEmail({ to: input.email, ...templates.contactReceived(input.name) });
  if (env.SUPPORT_NOTIFY_EMAIL) {
    await sendEmail({
      to: env.SUPPORT_NOTIFY_EMAIL,
      subject: `[Contact] ${input.subject}`,
      text: `From: ${input.name} <${input.email}>\nTopic: ${topicLabel(input.topic)}\n\n${input.message}\n\nConversation: ${conversation.id}`,
    });
  }
  return conversation;
}

/** Email address to notify for a conversation, if any. */
export async function conversationContactEmail(conversationId: string): Promise<{ email: string; subject: string } | null> {
  const c = await prisma.supportConversation.findUnique({
    where: { id: conversationId },
    select: { subject: true, guestEmail: true, user: { select: { email: true } } },
  });
  if (!c) return null;
  const email = c.user?.email ?? c.guestEmail;
  return email ? { email, subject: c.subject } : null;
}

export async function touchAgentPresence(userId: string, now = new Date()): Promise<Date> {
  const row = await prisma.agentPresence.upsert({
    where: { userId },
    create: { userId, lastSeenAt: now },
    update: { lastSeenAt: now },
  });
  return row.lastSeenAt;
}
