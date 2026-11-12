/**
 * Outbound email. Every message is recorded in OutboundEmail; when SMTP_URL is configured the
 * message is also delivered through nodemailer, otherwise it stays in the dev mailbox (/dev/mailbox).
 */
import nodemailer, { type Transporter } from "nodemailer";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export * as templates from "./templates";
export type { EmailContent } from "./templates";

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendEmailResult {
  id: string;
  sent: boolean;
  error?: string;
}

let transporter: Transporter | null = null;
let transporterUrl: string | null = null;

function getTransporter(url: string): Transporter {
  if (!transporter || transporterUrl !== url) {
    transporter = nodemailer.createTransport(url);
    transporterUrl = url;
  }
  return transporter;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const record = await prisma.outboundEmail.create({
    data: { to: input.to, subject: input.subject, text: input.text, html: input.html ?? null },
  });

  const smtpUrl = env.SMTP_URL;
  if (!smtpUrl) {
    console.log(`[email] captured (no SMTP_URL) → ${input.to} · "${input.subject}" · see /dev/mailbox`);
    return { id: record.id, sent: false };
  }

  try {
    await getTransporter(smtpUrl).sendMail({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    await prisma.outboundEmail.update({ where: { id: record.id }, data: { sentAt: new Date() } });
    return { id: record.id, sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] delivery failed → ${input.to}: ${message}`);
    await prisma.outboundEmail.update({ where: { id: record.id }, data: { error: message.slice(0, 1000) } }).catch(() => {});
    return { id: record.id, sent: false, error: message };
  }
}

/** Absolute link on the public site. */
export function siteLink(path: string): string {
  return `${env.SITE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
