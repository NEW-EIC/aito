import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────
// Vitest hoists vi.mock so we set up the doubles before the module imports.

vi.mock("@aito/database", () => {
  // Minimal stub of the Prisma namespace — handlers only touch the error-code
  // constants from it, not the runtime client.
  class PrismaClientKnownRequestError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.code = code;
    }
  }
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      plan: {
        findUnique: vi.fn(),
      },
      subscription: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
      },
      subscriptionEvent: {
        create: vi.fn(),
      },
      invoice: {
        upsert: vi.fn(),
      },
      $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
    },
    Prisma: { PrismaClientKnownRequestError },
    PlanKey: { free: "free", premium: "premium", pro: "pro" },
    BillingInterval: { monthly: "monthly", annual: "annual" },
    SubscriptionState: {
      trial: "trial",
      active: "active",
      past_due: "past_due",
      grace_period: "grace_period",
      canceled: "canceled",
      expired: "expired",
    },
    InvoiceStatus: { paid: "paid", open: "open", draft: "draft" },
  };
});

vi.mock("../client", () => ({
  stripe: {
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────

import { prisma } from "@aito/database";
import { stripe } from "../client";
import {
  handleCheckoutCompleted,
  handleSubscriptionCreated,
  handleInvoicePaymentFailed,
  handleInvoicePaymentSucceeded,
} from "../webhook-handlers";

// ─── Fixtures ─────────────────────────────────────────────────────────────

function makeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub_test_123",
    customer: "cus_test_123",
    status: "active",
    cancel_at_period_end: false,
    canceled_at: null,
    trial_end: null,
    metadata: { userId: "user_test_123", tier: "premium" },
    items: {
      data: [
        {
          price: { id: "price_premium_monthly" },
          current_period_start: 1700000000,
          current_period_end: 1702592000,
        },
      ],
    },
    ...overrides,
  };
}

function makeEvent(type: string, object: unknown, id = "evt_test_1") {
  return { id, type, data: { object } } as never;
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe("handleCheckoutCompleted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a Subscription row when the user already has a Stripe customer", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user_test_123",
      email: "test@example.com",
    });
    (prisma.plan.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "plan_uuid_premium",
    });
    (stripe.subscriptions.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSubscription(),
    );

    const event = makeEvent("checkout.session.completed", {
      mode: "subscription",
      customer: "cus_test_123",
      subscription: "sub_test_123",
      metadata: { userId: "user_test_123" },
    });
    await handleCheckoutCompleted(event);

    expect(prisma.subscription.upsert).toHaveBeenCalledTimes(1);
    const call = (prisma.subscription.upsert as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(call.where.stripeSubscriptionId).toBe("sub_test_123");
    expect(call.create.userId).toBe("user_test_123");
    expect(call.create.state).toBe("active");
    expect(call.create.planId).toBe("plan_uuid_premium");
  });

  it("falls back to metadata.userId and backfills the customer link", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(null) // first call: no user with this Stripe id yet
      .mockResolvedValueOnce({
        id: "user_test_123",
        email: "test@example.com",
      });
    (prisma.plan.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "plan_uuid_premium",
    });
    (stripe.subscriptions.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSubscription(),
    );

    const event = makeEvent("checkout.session.completed", {
      mode: "subscription",
      customer: "cus_test_999",
      subscription: "sub_test_123",
      metadata: { userId: "user_test_123" },
    });
    await handleCheckoutCompleted(event);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_test_123" },
      data: { stripeCustomerId: "cus_test_999" },
    });
  });

  it("ignores non-subscription Checkout sessions", async () => {
    const event = makeEvent("checkout.session.completed", {
      mode: "payment",
      customer: "cus_test_123",
    });
    await handleCheckoutCompleted(event);
    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
  });

  it("throws permanent failure if the price id is not in the registry", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user_test_123",
      email: "test@example.com",
    });
    (prisma.plan.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "plan_uuid_premium",
    });
    (stripe.subscriptions.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSubscription({
        items: {
          data: [
            {
              price: { id: "price_unknown" },
              current_period_start: 1700000000,
              current_period_end: 1702592000,
            },
          ],
        },
      }),
    );

    const event = makeEvent("checkout.session.completed", {
      mode: "subscription",
      customer: "cus_test_123",
      subscription: "sub_test_123",
      metadata: { userId: "user_test_123" },
    });
    await expect(handleCheckoutCompleted(event)).rejects.toThrow(
      /references unknown price/,
    );
  });
});

describe("handleSubscriptionCreated", () => {
  beforeEach(() => vi.clearAllMocks());

  it("upserts a Subscription with the Stripe-reported state", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user_test_123",
      email: "test@example.com",
    });
    (prisma.plan.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "plan_uuid_premium",
    });

    await handleSubscriptionCreated(
      makeEvent("customer.subscription.created", makeSubscription()),
    );
    expect(prisma.subscription.upsert).toHaveBeenCalledTimes(1);
  });

  it("maps Stripe `trialing` onto the domain trial state", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user_test_123",
      email: "test@example.com",
    });
    (prisma.plan.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "plan_uuid_premium",
    });

    await handleSubscriptionCreated(
      makeEvent(
        "customer.subscription.created",
        makeSubscription({ status: "trialing", trial_end: 1701000000 }),
      ),
    );
    const call = (prisma.subscription.upsert as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(call.create.state).toBe("trial");
  });
});

describe("handleInvoicePaymentFailed", () => {
  beforeEach(() => vi.clearAllMocks());

  it("transitions active → past_due via the state machine", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user_test_123",
      email: "test@example.com",
    });
    (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sub_db_uuid",
      stripeSubscriptionId: "sub_test_123",
      state: "active",
      userId: "user_test_123",
    });

    const event = makeEvent("invoice.payment_failed", {
      id: "in_test_1",
      customer: "cus_test_123",
      amount_due: 2400,
      amount_paid: 0,
      currency: "usd",
      created: 1700000000,
      status_transitions: {},
      total_taxes: [],
      lines: {
        data: [{ parent: { subscription_item_details: { subscription: "sub_test_123" } } }],
      },
      hosted_invoice_url: "https://stripe.test/invoice",
      invoice_pdf: null,
    });

    await handleInvoicePaymentFailed(event);

    expect(prisma.invoice.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.subscription.update).toHaveBeenCalledTimes(1);
    const subUpdate = (prisma.subscription.update as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(subUpdate.data.state).toBe("past_due");
  });

  it("doesn't crash if the state machine rejects (already past_due / canceled)", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user_test_123",
      email: "test@example.com",
    });
    (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sub_db_uuid",
      stripeSubscriptionId: "sub_test_123",
      state: "expired",
      userId: "user_test_123",
    });

    const event = makeEvent("invoice.payment_failed", {
      id: "in_test_2",
      customer: "cus_test_123",
      amount_due: 2400,
      amount_paid: 0,
      currency: "usd",
      created: 1700000000,
      status_transitions: {},
      total_taxes: [],
      lines: {
        data: [{ parent: { subscription_item_details: { subscription: "sub_test_123" } } }],
      },
    });

    // Must NOT throw — expired → past_due is illegal but the handler should
    // swallow IllegalTransitionError after recording the invoice.
    await expect(handleInvoicePaymentFailed(event)).resolves.toBeUndefined();
    expect(prisma.invoice.upsert).toHaveBeenCalledTimes(1);
  });
});

describe("handleInvoicePaymentSucceeded", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recovers past_due → active when a retry clears", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user_test_123",
      email: "test@example.com",
    });
    (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sub_db_uuid",
      stripeSubscriptionId: "sub_test_123",
      state: "past_due",
      userId: "user_test_123",
    });

    await handleInvoicePaymentSucceeded(
      makeEvent("invoice.payment_succeeded", {
        id: "in_test_3",
        customer: "cus_test_123",
        amount_due: 2400,
        amount_paid: 2400,
        currency: "usd",
        created: 1700000000,
        status_transitions: { paid_at: 1700100000 },
        total_taxes: [{ amount: 0 }],
        lines: {
          data: [
            { parent: { subscription_item_details: { subscription: "sub_test_123" } } },
          ],
        },
      }),
    );

    expect(prisma.subscription.update).toHaveBeenCalledTimes(1);
    const subUpdate = (prisma.subscription.update as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(subUpdate.data.state).toBe("active");
  });

  it("doesn't transition when the subscription is already active", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user_test_123",
      email: "test@example.com",
    });
    (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sub_db_uuid",
      stripeSubscriptionId: "sub_test_123",
      state: "active",
      userId: "user_test_123",
    });

    await handleInvoicePaymentSucceeded(
      makeEvent("invoice.payment_succeeded", {
        id: "in_test_4",
        customer: "cus_test_123",
        amount_due: 2400,
        amount_paid: 2400,
        currency: "usd",
        created: 1700000000,
        status_transitions: { paid_at: 1700100000 },
        total_taxes: [],
        lines: {
          data: [
            { parent: { subscription_item_details: { subscription: "sub_test_123" } } },
          ],
        },
      }),
    );

    expect(prisma.invoice.upsert).toHaveBeenCalledTimes(1);
    // No state change → no subscription.update call.
    expect(prisma.subscription.update).not.toHaveBeenCalled();
  });
});
