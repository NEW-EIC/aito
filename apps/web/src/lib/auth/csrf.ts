import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { randomBytes, timingSafeEqual } from "node:crypto";

export const CSRF_COOKIE_NAME = "aito-csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";

/** 32 random bytes hex → 64 chars. */
function newToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Get the existing CSRF cookie value or issue a fresh one. Safe to call
 * multiple times in a request — rotates only when missing.
 *
 * The cookie is NOT httpOnly: the JS form-submit code must read it to put
 * the same value in the x-csrf-token header (double-submit pattern).
 */
export async function ensureCsrfCookie(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CSRF_COOKIE_NAME)?.value;
  if (existing && /^[0-9a-f]{64}$/.test(existing)) return existing;
  const token = newToken();
  jar.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Long-lived: a CSRF cookie is a per-browser secret, not session-scoped.
    maxAge: 60 * 60 * 24 * 365,
  });
  return token;
}

/**
 * Verify a state-changing request carries a matching CSRF token in both the
 * cookie and the x-csrf-token header. Constant-time compare on the pair.
 *
 * Returns null when the request is OK, or a NextResponse-shaped object the
 * caller can return verbatim.
 */
export async function verifyCsrf(
  req: NextRequest,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  // Method gate: only enforce on unsafe methods. GET/HEAD/OPTIONS skip.
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return { ok: true };
  }
  const headerToken = req.headers.get(CSRF_HEADER_NAME);
  const jar = await cookies();
  const cookieToken = jar.get(CSRF_COOKIE_NAME)?.value;
  if (
    !headerToken ||
    !cookieToken ||
    headerToken.length !== 64 ||
    cookieToken.length !== 64 ||
    !/^[0-9a-f]{64}$/.test(headerToken) ||
    !/^[0-9a-f]{64}$/.test(cookieToken)
  ) {
    return { ok: false, status: 403, error: "csrf" };
  }
  try {
    if (
      !timingSafeEqual(Buffer.from(headerToken, "hex"), Buffer.from(cookieToken, "hex"))
    ) {
      return { ok: false, status: 403, error: "csrf" };
    }
  } catch {
    return { ok: false, status: 403, error: "csrf" };
  }
  return { ok: true };
}
