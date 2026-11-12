// @vitest-environment node
import "../db-setup";
import { describe, expect, it } from "vitest";
import { getSupportStatus, officeHoursAt, zonedParts, zonedTimeToUtc } from "@/lib/support/status";
import { siteConfig } from "@/config/site";

const TZ = "Australia/Sydney";

/** Build an instant from Sydney wall-clock time. */
function sydney(y: number, m: number, d: number, h: number, min = 0): Date {
  return zonedTimeToUtc(TZ, y, m, d, h, min);
}

describe("office hours (Mon–Fri 08:00–18:00, Australia/Sydney)", () => {
  it("converts zoned wall-clock times correctly (AEDT in January, AEST in July)", () => {
    expect(sydney(2026, 1, 12, 9, 0).toISOString()).toBe("2026-01-11T22:00:00.000Z"); // UTC+11
    expect(sydney(2026, 7, 13, 9, 0).toISOString()).toBe("2026-07-12T23:00:00.000Z"); // UTC+10
    expect(zonedParts(sydney(2026, 7, 13, 9, 30), TZ)).toMatchObject({ weekday: 1, hour: 9, minute: 30 });
  });

  it("is open mid-morning on a weekday", () => {
    // Monday 12 Jan 2026 10:00 Sydney
    expect(officeHoursAt(sydney(2026, 1, 12, 10), TZ)).toEqual({ open: true });
    // Boundaries: opens at 08:00, closes at 18:00
    expect(officeHoursAt(sydney(2026, 1, 12, 8, 0), TZ).open).toBe(true);
    expect(officeHoursAt(sydney(2026, 1, 12, 17, 59), TZ).open).toBe(true);
    expect(officeHoursAt(sydney(2026, 1, 12, 18, 0), TZ).open).toBe(false);
  });

  it("is closed early morning and reports today's opening time", () => {
    const r = officeHoursAt(sydney(2026, 1, 13, 6, 30), TZ); // Tuesday 06:30
    expect(r.open).toBe(false);
    expect(r.nextOpen?.toISOString()).toBe(sydney(2026, 1, 13, 8).toISOString());
  });

  it("is closed in the evening and reports tomorrow's opening time", () => {
    const r = officeHoursAt(sydney(2026, 1, 13, 19, 0), TZ); // Tuesday 19:00
    expect(r.open).toBe(false);
    expect(r.nextOpen?.toISOString()).toBe(sydney(2026, 1, 14, 8).toISOString());
  });

  it("is closed at the weekend and reports Monday 08:00", () => {
    const sat = officeHoursAt(sydney(2026, 1, 17, 11, 0), TZ);
    expect(sat.open).toBe(false);
    expect(sat.nextOpen?.toISOString()).toBe(sydney(2026, 1, 19, 8).toISOString());
    const friNight = officeHoursAt(sydney(2026, 1, 16, 22, 0), TZ);
    expect(friNight.nextOpen?.toISOString()).toBe(sydney(2026, 1, 19, 8).toISOString());
  });
});

describe("getSupportStatus", () => {
  const openTime = sydney(2026, 1, 14, 11, 0); // Wednesday 11:00
  const closedTime = sydney(2026, 1, 14, 21, 0); // Wednesday 21:00
  const windowMs = siteConfig.support.presenceWindowMinutes * 60 * 1000;

  it("is online only when an agent heartbeat is fresh AND the office is open", async () => {
    const fresh = async () => new Date(openTime.getTime() - 2 * 60 * 1000);
    const s = await getSupportStatus({ now: openTime, lastAgentSeen: fresh });
    expect(s.online).toBe(true);
    expect(s.withinHours).toBe(true);
    expect(s.nextOpen).toBeUndefined();
    expect(s.hours).toBe(siteConfig.support.hours);
  });

  it("is offline during office hours when no agent is present or the heartbeat is stale", async () => {
    const none = await getSupportStatus({ now: openTime, lastAgentSeen: async () => null });
    expect(none.online).toBe(false);
    expect(none.withinHours).toBe(true);
    const stale = await getSupportStatus({ now: openTime, lastAgentSeen: async () => new Date(openTime.getTime() - windowMs - 1000) });
    expect(stale.online).toBe(false);
  });

  it("is offline outside office hours even with a fresh heartbeat, and says when it reopens", async () => {
    const s = await getSupportStatus({ now: closedTime, lastAgentSeen: async () => new Date(closedTime.getTime() - 1000) });
    expect(s.online).toBe(false);
    expect(s.withinHours).toBe(false);
    expect(s.nextOpen).toBe(sydney(2026, 1, 15, 8).toISOString());
    expect(s.nextOpenLabel).toMatch(/Thursday/);
    expect(s.message).toMatch(/offline/i);
  });

  it("reads presence from the database when no override is given (empty DB → offline)", async () => {
    const s = await getSupportStatus({ now: openTime });
    expect(s.online).toBe(false);
  });
});
