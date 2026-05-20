/**
 * Stub for Milestone 2 — social sign-in. Render nothing until a provider is
 * configured, so we don't ship dead buttons. The shape is in place so M2 can
 * drop in `<Button>` rows here without restructuring the surrounding card.
 */
export function SocialSignInButtons() {
  const enabled =
    process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1" ||
    process.env.NEXT_PUBLIC_AUTH_APPLE === "1" ||
    process.env.NEXT_PUBLIC_AUTH_GITHUB === "1";
  if (!enabled) return null;
  return (
    <div className="space-y-2" data-social-providers="pending-m2" />
  );
}
