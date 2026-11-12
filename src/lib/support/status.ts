/**
 * Support availability. "Online" is only ever true when BOTH hold:
 *   1. a SUPPORT/ADMIN agent sent a presence heartbeat within siteConfig.support.presenceWindowMinutes, and
 *   2. the current time is inside office hours (Mon–Fri 08:00–18:00) in siteConfig.support.timezone.
 * This is what keeps the public widget from claiming a human is available when nobody is.
 */
import { siteConfig } from "@/config/site";
import { prisma } from "@/lib/db";

export const OFFICE_OPEN_HOUR = 8;
export const OFFICE_CLOSE_HOUR = 18;
/** 1 = Monday … 5 = Friday (ISO weekday numbers). */
const OFFICE_DAYS = new Set([1, 2, 3, 4, 5]);

export interface SupportStatus {
  online: boolean;
  /** Human-readable office hours from config. */
  hours: string;
  /** ISO timestamp of the next opening time when currently outside office hours. */
  nextOpen?: string;
  /** e.g. "Monday 08:00 AEDT" */
  nextOpenLabel?: string;
  withinHours: boolean;
  message: string;
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** ISO weekday 1 (Mon) … 7 (Sun). */
  weekday: number;
}

const weekdayIndex: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) parts[p.type] = p.value;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    weekday: weekdayIndex[parts.weekday] ?? 0,
  };
}

/** Convert a wall-clock time in `timeZone` to an instant (exact except during a DST gap). */
export function zonedTimeToUtc(timeZone: string, y: number, m: number, d: number, h: number, min: number): Date {
  const guess = Date.UTC(y, m - 1, d, h, min);
  const p = zonedParts(new Date(guess), timeZone);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return new Date(guess - (asIfUtc - guess));
}

export interface OfficeHoursResult {
  open: boolean;
  nextOpen?: Date;
}

/** Pure office-hours check with an injectable clock (used by tests). */
export function officeHoursAt(now: Date, timeZone: string = siteConfig.support.timezone): OfficeHoursResult {
  const p = zonedParts(now, timeZone);
  const minutes = p.hour * 60 + p.minute;
  const open = OFFICE_DAYS.has(p.weekday) && minutes >= OFFICE_OPEN_HOUR * 60 && minutes < OFFICE_CLOSE_HOUR * 60;
  if (open) return { open: true };

  // Walk forward day by day (max one week) to the next opening instant.
  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
    const c = zonedParts(candidate, timeZone);
    if (!OFFICE_DAYS.has(c.weekday)) continue;
    const opensAt = zonedTimeToUtc(timeZone, c.year, c.month, c.day, OFFICE_OPEN_HOUR, 0);
    if (opensAt.getTime() > now.getTime()) return { open: false, nextOpen: opensAt };
  }
  return { open: false };
}

export function formatNextOpen(date: Date, timeZone: string = siteConfig.support.timezone): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  }).format(date);
}

export interface SupportStatusOptions {
  now?: Date;
  /** Override the presence lookup (tests). Returns the most recent agent heartbeat or null. */
  lastAgentSeen?: () => Promise<Date | null>;
}

async function latestAgentHeartbeat(): Promise<Date | null> {
  const row = await prisma.agentPresence.findFirst({
    where: { user: { role: { in: ["SUPPORT", "ADMIN"] }, status: "ACTIVE" } },
    orderBy: { lastSeenAt: "desc" },
    select: { lastSeenAt: true },
  });
  return row?.lastSeenAt ?? null;
}

export async function getSupportStatus(opts: SupportStatusOptions = {}): Promise<SupportStatus> {
  const now = opts.now ?? new Date();
  const timeZone = siteConfig.support.timezone;
  const hours = officeHoursAt(now, timeZone);
  const seen = await (opts.lastAgentSeen ?? latestAgentHeartbeat)();
  const presenceWindowMs = siteConfig.support.presenceWindowMinutes * 60 * 1000;
  const agentPresent = seen !== null && now.getTime() - seen.getTime() <= presenceWindowMs && seen.getTime() <= now.getTime() + 60_000;
  const online = hours.open && agentPresent;

  const nextOpenLabel = hours.nextOpen ? formatNextOpen(hours.nextOpen, timeZone) : undefined;
  let message: string;
  if (online) message = "Our support team is online now.";
  else if (hours.open) message = "Support is open but no agent is available right now. Leave a message and we'll reply by email.";
  else message = nextOpenLabel ? `Support is offline. We're back ${nextOpenLabel}.` : "Support is currently offline. Leave a message and we'll reply by email.";

  return {
    online,
    hours: siteConfig.support.hours,
    nextOpen: hours.nextOpen?.toISOString(),
    nextOpenLabel,
    withinHours: hours.open,
    message,
  };
}
