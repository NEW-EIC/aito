# @aito/ui

Shared design-system primitives for AITO apps.

## Components

| Component | Use |
|---|---|
| `Logo` | Brand mark + wordmark (sizes via `size` prop, theme-aware) |
| `Button` | Primary / secondary / ghost / outline variants × sm / md / lg sizes |
| `Badge` | Inline tag with semantic tones |
| `TierPill` | Pre-styled badge for "Reader / Premium / Pro Desk" |
| `Card` | Surface container, optional `hover` lift |
| `cn` | Tailwind class-merge helper (re-exported) |

## Usage

```tsx
import { Button, Card, TierPill } from "@aito/ui";

<Card hover className="p-6">
  <TierPill tier="Premium" />
  <Button size="lg">Subscribe</Button>
</Card>
```

## Consumer requirements

- React 18+
- Next.js 15+ (for `Logo` which uses `next/image`)
- Tailwind 3+ with the `@aito/config` preset applied
- CSS variables for `--bg`, `--fg`, `--border`, etc. defined in your `globals.css`
