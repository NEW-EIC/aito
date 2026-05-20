# @aito/domain

Pure-TS business rules shared across web / api / mobile. Zero React, zero DOM, zero Node-only APIs — runs in browsers, edge runtimes, and Node.

## Exports

```ts
import {
  // Subscription state machine
  transition, isActive, IllegalTransitionError,
  type Subscription, type SubscriptionState, type SubscriptionEvent,

  // Paywall rule engine
  checkAccess, type ViewerContext, type Resource, type Decision,

  // Entitlement (app-side cache model)
  isEntitlementFresh, shouldRevalidate, type Entitlement,
} from "@aito/domain";
```

## Why a separate package

- The Next.js web app, the Hono API (W6+), and the React Native app (W6+) all gate access using the same rules. Putting them in one package guarantees they can't drift.
- This package has its own Vitest suite. New rules are tested here before any consumer ships.
- The schema (`@aito/database`) is the data shape; this package is the *logic* over it.

## Run tests

```bash
pnpm --filter @aito/domain test
```

Coverage report goes to `coverage/index.html`. Aim ≥80% line coverage on every PR.

## Adding a new transition

1. Add the event type to `SubscriptionEvent` in `subscription.ts`
2. Add the transition row to the `ALLOWED` table
3. Add a test in `__tests__/subscription.test.ts` proving both legal and illegal paths
4. Export it from `index.ts` if it's a new public type

Tests are the contract — touch them when behavior changes; never just adjust them to make a broken implementation pass.
