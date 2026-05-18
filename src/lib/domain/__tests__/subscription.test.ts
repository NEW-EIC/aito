import { describe, it, expect } from "vitest";
import {
  transition,
  IllegalTransitionError,
  isActive,
  type Subscription,
} from "../subscription";

const baseSub = (state: Subscription["state"]): Subscription => ({
  userId: "u1",
  tier: "premium",
  state,
});

describe("subscription state machine", () => {
  it("trial -> active on conversion", () => {
    const next = transition(baseSub("trial"), { type: "trial.converted" });
    expect(next.state).toBe("active");
  });

  it("active -> past_due on payment failure", () => {
    const next = transition(baseSub("active"), { type: "payment.failed" });
    expect(next.state).toBe("past_due");
  });

  it("past_due -> grace_period on second failure with 7d window", () => {
    const now = new Date("2026-01-01");
    const next = transition(baseSub("past_due"), { type: "payment.failed" }, now);
    expect(next.state).toBe("grace_period");
    expect(next.graceEndsAt).toBeInstanceOf(Date);
    const days = ((next.graceEndsAt!.getTime() - now.getTime()) / 86_400_000);
    expect(days).toBeCloseTo(7, 0);
  });

  it("grace_period -> active on payment recovery", () => {
    const next = transition(baseSub("grace_period"), { type: "payment.succeeded" });
    expect(next.state).toBe("active");
  });

  it("grace_period -> expired when grace runs out", () => {
    const next = transition(baseSub("grace_period"), { type: "grace.expired" });
    expect(next.state).toBe("expired");
  });

  it("canceled -> expired on term end", () => {
    const next = transition(baseSub("canceled"), { type: "term.ended" });
    expect(next.state).toBe("expired");
  });

  it("expired -> trial when restarting", () => {
    const next = transition(baseSub("expired"), { type: "trial.started" });
    expect(next.state).toBe("trial");
    expect(next.trialEndsAt).toBeInstanceOf(Date);
  });

  it("rejects illegal transitions", () => {
    expect(() =>
      transition(baseSub("expired"), { type: "payment.failed" }),
    ).toThrow(IllegalTransitionError);
  });

  it("isActive() includes trial, active, grace_period only", () => {
    expect(isActive("trial")).toBe(true);
    expect(isActive("active")).toBe(true);
    expect(isActive("grace_period")).toBe(true);
    expect(isActive("past_due")).toBe(false);
    expect(isActive("canceled")).toBe(false);
    expect(isActive("expired")).toBe(false);
  });
});
