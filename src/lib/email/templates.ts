/**
 * Plain email templates. Each returns { subject, text, html }. Keep them short, honest and free of
 * marketing claims; links are absolute (built from env.SITE_URL by the caller).
 */
import { siteConfig } from "@/config/site";

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f6f8fc;font-family:Arial,Helvetica,sans-serif;color:#0b1220;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e3e8f0;border-radius:12px;padding:32px;">
      <p style="margin:0 0 20px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#8a96ad;">${escapeHtml(siteConfig.name)}</p>
      <h1 style="margin:0 0 16px;font-size:20px;">${escapeHtml(title)}</h1>
      ${bodyHtml}
      <p style="margin:28px 0 0;font-size:12px;color:#8a96ad;">If you did not expect this email you can safely ignore it.</p>
    </div>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0;"><a href="${escapeHtml(href)}" style="display:inline-block;background:#d4a233;color:#1a1304;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;">${escapeHtml(label)}</a></p>
<p style="font-size:12px;color:#5b6780;word-break:break-all;">Or paste this link into your browser:<br>${escapeHtml(href)}</p>`;
}

export function verifyEmail(link: string): EmailContent {
  const subject = `Verify your email for ${siteConfig.name}`;
  const text = [
    `Welcome to ${siteConfig.name}.`,
    "",
    "Confirm your email address by opening this link (valid for 24 hours):",
    link,
    "",
    "If you did not create an account you can ignore this message.",
  ].join("\n");
  const html = layout(
    "Confirm your email address",
    `<p>Thanks for creating an account. Confirm your email address to continue. The link is valid for 24 hours.</p>${button(link, "Verify email")}`,
  );
  return { subject, text, html };
}

export function resetPassword(link: string): EmailContent {
  const subject = `Reset your ${siteConfig.name} password`;
  const text = [
    "We received a request to reset the password for your account.",
    "",
    "Open this link to choose a new password (valid for 1 hour):",
    link,
    "",
    "If you did not request a reset, no action is needed; your password has not changed.",
  ].join("\n");
  const html = layout(
    "Reset your password",
    `<p>We received a request to reset the password for your account. The link is valid for 1 hour.</p>${button(link, "Choose a new password")}<p style="font-size:13px;color:#5b6780;">If you did not request a reset, no action is needed; your password has not changed.</p>`,
  );
  return { subject, text, html };
}

const statusCopy: Record<string, { title: string; body: string }> = {
  SUBMITTED: {
    title: "We have received your application",
    body: "Your account application has been submitted and is queued for review. We will email you when its status changes.",
  },
  UNDER_REVIEW: {
    title: "Your application is under review",
    body: "A member of our onboarding team is reviewing your application. No action is required from you right now.",
  },
  MORE_INFO: {
    title: "We need a little more information",
    body: "Our onboarding team needs some additional details before we can continue. Please sign in and update your application.",
  },
  APPROVED: {
    title: "Your application has been approved",
    body: "Your account application has been approved. Sign in to continue setting up your account.",
  },
  REJECTED: {
    title: "An update on your application",
    body: "We are unable to approve your application at this time. Our team may have left notes below.",
  },
};

export function applicationStatus(status: string, notes?: string | null): EmailContent {
  const copy = statusCopy[status] ?? { title: "An update on your application", body: `Your application status is now ${status}.` };
  const subject = `${copy.title} — ${siteConfig.name}`;
  const link = `${siteConfig.url}/dashboard/application`;
  const textLines = [copy.body, ""];
  if (notes) textLines.push("Notes from our team:", notes, "");
  textLines.push("View your application:", link);
  const html = layout(
    copy.title,
    `<p>${escapeHtml(copy.body)}</p>${
      notes ? `<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #d4a233;background:#fff8e6;white-space:pre-wrap;">${escapeHtml(notes)}</blockquote>` : ""
    }${button(link, "View application")}`,
  );
  return { subject, text: textLines.join("\n"), html };
}

export function supportReply(subject: string, body: string): EmailContent {
  const link = `${siteConfig.url}/support`;
  const text = [`Our support team replied to: ${subject}`, "", body, "", `Continue the conversation: ${link}`].join("\n");
  const html = layout(
    `Re: ${subject}`,
    `<p>Our support team replied to your enquiry:</p><blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #d4a233;background:#f6f8fc;white-space:pre-wrap;">${escapeHtml(body)}</blockquote>${button(link, "Continue the conversation")}`,
  );
  return { subject: `Re: ${subject}`, text, html };
}

export function contactReceived(name: string): EmailContent {
  const subject = `We received your message — ${siteConfig.name}`;
  const text = [
    `Hi ${name},`,
    "",
    `Thanks for contacting ${siteConfig.name}. We have received your message and a member of our team will reply by email.`,
    "",
    `Support hours: ${siteConfig.support.hours}.`,
  ].join("\n");
  const html = layout(
    "Thanks for getting in touch",
    `<p>Hi ${escapeHtml(name)},</p><p>Thanks for contacting ${escapeHtml(siteConfig.name)}. We have received your message and a member of our team will reply by email.</p><p style="font-size:13px;color:#5b6780;">Support hours: ${escapeHtml(siteConfig.support.hours)}.</p>`,
  );
  return { subject, text, html };
}
