import { z } from "zod";
import { emailSchema, nameSchema } from "./auth";

export const SUPPORT_TOPICS = [
  { value: "general", label: "General enquiry" },
  { value: "individual", label: "Individual account" },
  { value: "corporate", label: "Corporate account" },
  { value: "smsf", label: "SMSF account" },
  { value: "platform", label: "Platform & tools" },
  { value: "compliance", label: "Compliance & verification" },
  { value: "technical", label: "Technical issue" },
] as const;

export const supportTopicSchema = z.enum(SUPPORT_TOPICS.map((t) => t.value) as [string, ...string[]]);

const messageSchema = z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(4000, "Keep it under 4000 characters");

export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  topic: supportTopicSchema.default("general"),
  subject: z.string().trim().min(3, "Add a short subject").max(150),
  message: messageSchema,
  /** Honeypot: must stay empty. */
  company_url: z.string().max(0).optional(),
  /** Timing check: ms since the form rendered. Bots submit instantly. */
  elapsedMs: z.number().int().nonnegative().optional(),
});
export type ContactFormInput = z.infer<typeof contactFormSchema>;

export const chatStartSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  message: messageSchema,
  topic: supportTopicSchema.optional(),
  company_url: z.string().max(0).optional(),
});
export type ChatStartInput = z.infer<typeof chatStartSchema>;

export const chatMessageSchema = z.object({
  body: z.string().trim().min(1, "Type a message").max(4000),
});
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

export const agentReplySchema = z.object({
  body: z.string().trim().min(1).max(8000),
  status: z.enum(["OPEN", "PENDING", "CLOSED"]).optional(),
});
