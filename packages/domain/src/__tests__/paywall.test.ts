import { describe, it, expect } from "vitest";
import { checkAccess, type Resource, type ViewerContext } from "../paywall";

const anon: ViewerContext = {
  isAuthenticated: false,
  tier: "free",
  subscriptionState: null,
};

const freePlan: ViewerContext = {
  isAuthenticated: true,
  tier: "free",
  subscriptionState: null,
};

const premiumActive: ViewerContext = {
  isAuthenticated: true,
  tier: "premium",
  subscriptionState: "active",
};

const proActive: ViewerContext = {
  isAuthenticated: true,
  tier: "pro",
  subscriptionState: "active",
};

const premiumPastDue: ViewerContext = {
  isAuthenticated: true,
  tier: "premium",
  subscriptionState: "past_due",
};

const freeArticle: Resource = { kind: "newsletter", tier: "free" };
const premiumArticle: Resource = { kind: "newsletter", tier: "premium" };
const proModel: Resource = { kind: "model_file", tier: "pro" };

describe("paywall.checkAccess", () => {
  it("free content is public", () => {
    expect(checkAccess(anon, freeArticle).allow).toBe(true);
  });

  it("anonymous on premium content needs sign-in", () => {
    const d = checkAccess(anon, premiumArticle);
    expect(d.allow).toBe(false);
    if (!d.allow) expect(d.reason).toBe("needs_signin");
  });

  it("free plan on premium content needs upgrade", () => {
    const d = checkAccess(freePlan, premiumArticle);
    expect(d.allow).toBe(false);
    if (!d.allow) expect(d.reason).toBe("needs_upgrade");
  });

  it("premium-active on premium content is allowed", () => {
    expect(checkAccess(premiumActive, premiumArticle).allow).toBe(true);
  });

  it("premium-active on pro content is denied (insufficient tier)", () => {
    const d = checkAccess(premiumActive, proModel);
    expect(d.allow).toBe(false);
    if (!d.allow) expect(d.requiredTier).toBe("pro");
  });

  it("pro-active on pro content is allowed", () => {
    expect(checkAccess(proActive, proModel).allow).toBe(true);
  });

  it("past_due is not entitled", () => {
    const d = checkAccess(premiumPastDue, premiumArticle);
    expect(d.allow).toBe(false);
    if (!d.allow) expect(d.reason).toBe("needs_upgrade");
  });
});
