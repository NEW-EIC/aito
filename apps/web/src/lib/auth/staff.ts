/**
 * Staff / RBAC helpers for the /admin surface.
 *
 * Mirrors the shape of `viewer.ts` — a `requireStaff()` guard for layouts
 * and pages, and a `requirePermission()` guard for individual server
 * actions that perform writes. Both throw via Next's `redirect()` if the
 * caller fails the check, so callers don't have to handle the unhappy
 * path.
 *
 * Definitions:
 *   - "staff" = the user has any non-revoked, non-expired UserRole grant
 *     that points at a system role. We do NOT require a StaffProfile row
 *     because Phase A skips the HR / department metadata UI (Phase B).
 *   - "permission" = at least one of the user's active roles has a
 *     RolePermission row pointing at a Permission with the requested key.
 *
 * Caching: viewer.ts uses React's `cache()` per request; do the same here
 * so a layout + a page + a server action in the same request only run the
 * underlying queries once.
 */

import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@aito/database";
import { getSessionFromCookie } from "./session";

export interface StaffContext {
  userId: string;
  email: string;
  /** Permission keys the user currently holds (deduped across roles). */
  permissionKeys: Set<string>;
  /** Role keys the user holds (e.g. ["super_admin"]). */
  roleKeys: string[];
}

const ANONYMOUS_REDIRECT = "/sign-in?redirectTo=/admin";

/**
 * Resolve the current request's staff context, or null if the viewer is
 * either signed out or signed in without any active role grant.
 *
 * Memoised per-request via React `cache()`.
 */
export const getStaffContext = cache(async (): Promise<StaffContext | null> => {
  const current = await getSessionFromCookie();
  if (!current) return null;

  const now = new Date();
  const grants = await prisma.userRole.findMany({
    where: {
      userId: current.user.id,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  if (grants.length === 0) return null;

  const permissionKeys = new Set<string>();
  const roleKeys: string[] = [];
  for (const grant of grants) {
    roleKeys.push(grant.role.key);
    for (const rp of grant.role.permissions) {
      permissionKeys.add(rp.permission.key);
    }
  }

  return {
    userId: current.user.id,
    email: current.user.email,
    permissionKeys,
    roleKeys,
  };
});

/**
 * Page / layout guard. Redirects to /sign-in (with next=/admin) if anonymous,
 * or to /dashboard if signed in but lacking staff privileges.
 *
 * Use at the top of every /admin page or layout. Returns the context for
 * convenience.
 */
export async function requireStaff(): Promise<StaffContext> {
  const ctx = await getStaffContext();
  if (!ctx) {
    // Distinguish "not signed in" from "signed in but not staff" so we
    // don't trap legitimate non-staff users on an endless redirect loop.
    const current = await getSessionFromCookie();
    if (!current) redirect(ANONYMOUS_REDIRECT);
    redirect("/dashboard");
  }
  return ctx;
}

/**
 * Server-action guard. Throws (so the action returns a serialisable error
 * to the client) if the viewer lacks the named permission. Use at the top
 * of every server action that performs an admin write.
 *
 * Throw, don't redirect — server actions can't redirect cleanly mid-call,
 * and clients should display "you can't do this" rather than navigating
 * away from a half-filled form.
 */
export async function requirePermission(
  key: string,
): Promise<StaffContext> {
  const ctx = await getStaffContext();
  if (!ctx) {
    throw new StaffAuthError("not_staff", `permission "${key}" requires staff access`);
  }
  if (!ctx.permissionKeys.has(key)) {
    throw new StaffAuthError(
      "permission_denied",
      `viewer lacks permission "${key}"`,
    );
  }
  return ctx;
}

/** Boolean variant for conditional rendering inside server components. */
export async function hasPermission(key: string): Promise<boolean> {
  const ctx = await getStaffContext();
  return !!ctx?.permissionKeys.has(key);
}

export class StaffAuthError extends Error {
  constructor(
    public readonly code: "not_staff" | "permission_denied",
    message: string,
  ) {
    super(message);
    this.name = "StaffAuthError";
  }
}
