/**
 * In-memory sliding-window rate limiter. Process-local — fine for a single
 * Next.js dev / single-region small prod deploy. Replace with Upstash Redis
 * before scaling horizontally.
 */

type WindowKey = string;
type Hit = { count: number; resetAt: number };

const STORE = new Map<WindowKey, Hit>();

// Test-only access. Read by the /api/auth/__test__/reset-rate-limit route.
// Not part of the public API — name is mangled enough that prod callers
// won't reach for it accidentally.
export const __TEST_STORE: Map<WindowKey, Hit> = STORE;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetMs: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const slot = STORE.get(key);
  if (!slot || slot.resetAt <= now) {
    STORE.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetMs: windowMs };
  }
  slot.count += 1;
  const remaining = Math.max(0, limit - slot.count);
  return { ok: slot.count <= limit, remaining, resetMs: slot.resetAt - now };
}

/** Reset the window for a key, e.g. after a successful action. */
export function resetRateLimit(key: string): void {
  STORE.delete(key);
}

/**
 * Per-IP gate used by every auth endpoint. Enforces TWO ceilings per the
 * stated policy: 10 requests / minute AND 60 requests / hour. The minute
 * gate stops bursts; the hour gate stops slow drips that would skirt it.
 */
export function rateLimitAuthIp(ip: string | null, route: string): RateLimitResult {
  const ipKey = ip ?? "unknown";
  const perMin = rateLimit(`auth:ip:min:${ipKey}:${route}`, 10, 60_000);
  if (!perMin.ok) return perMin;
  const perHour = rateLimit(`auth:ip:hr:${ipKey}:${route}`, 60, 60 * 60_000);
  return perHour;
}

/** Per-account: 5 failed signin attempts in a 15-minute rolling window. */
export const ACCOUNT_LOCKOUT_THRESHOLD = 5;
export const ACCOUNT_LOCKOUT_MS = 15 * 60 * 1000;
/** The window during which failed attempts accumulate toward the threshold. */
export const ACCOUNT_LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
