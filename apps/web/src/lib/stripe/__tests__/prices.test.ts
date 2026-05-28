import { describe, it, expect } from "vitest";
import {
  resolvePriceId,
  lookupTierByPriceId,
  PRICE_REGISTRY,
} from "../prices";

describe("resolvePriceId", () => {
  it("returns the env-configured id for known tier/interval pairs", () => {
    expect(resolvePriceId("premium", "month")).toBe("price_premium_monthly");
    expect(resolvePriceId("premium", "year")).toBe("price_premium_yearly");
    expect(resolvePriceId("pro", "month")).toBe("price_pro_monthly");
    expect(resolvePriceId("pro", "year")).toBe("price_pro_yearly");
  });

  it("throws for an unknown tier", () => {
    // @ts-expect-error — deliberate misuse to exercise the guard
    expect(() => resolvePriceId("evil", "month")).toThrow(/Unknown price/);
  });

  it("throws for an unknown interval", () => {
    // @ts-expect-error — deliberate misuse to exercise the guard
    expect(() => resolvePriceId("premium", "lifetime")).toThrow(
      /Unknown price/,
    );
  });
});

describe("lookupTierByPriceId", () => {
  it("round-trips every entry in the registry", () => {
    for (const tier of Object.keys(PRICE_REGISTRY) as Array<"premium" | "pro">) {
      for (const interval of ["month", "year"] as const) {
        const id = PRICE_REGISTRY[tier][interval];
        const reverse = lookupTierByPriceId(id);
        expect(reverse).toEqual({ tier, interval });
      }
    }
  });

  it("returns null for an unknown price id", () => {
    expect(lookupTierByPriceId("price_fake_id")).toBeNull();
  });
});
