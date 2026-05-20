/**
 * @aito/ui — shared design-system primitives.
 *
 * Shadcn-style components built on top of Tailwind + the brand tokens
 * declared in @aito/config's tailwind preset. Light + dark mode via
 * semantic CSS variables defined in each app's globals.css.
 */

export { Logo } from "./Logo";
export { Button, type ButtonProps } from "./Button";
export { Badge, TierPill } from "./Badge";
export { Card } from "./Card";
export { cn } from "./utils";
