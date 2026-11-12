import { describe, expect, it } from "vitest";
import { isReplay, nextLastUsedStep, totpStep } from "@/lib/auth/mfa";

describe("TOTP replay guard", () => {
  const t0 = 1_800_000_000_000; // arbitrary fixed time

  it("records the step after the accepted one", () => {
    expect(nextLastUsedStep(t0)).toBe(totpStep(t0) + 1);
  });

  it("rejects any code while the current step is within the recorded window", () => {
    const last = nextLastUsedStep(t0);
    expect(isReplay(last, t0)).toBe(true);
    expect(isReplay(last, t0 + 30_000)).toBe(true); // the old code would still verify here
  });

  it("accepts again once the window has passed, and when nothing was recorded", () => {
    const last = nextLastUsedStep(t0);
    expect(isReplay(last, t0 + 60_000)).toBe(false);
    expect(isReplay(null, t0)).toBe(false);
    expect(isReplay(undefined, t0)).toBe(false);
  });
});
