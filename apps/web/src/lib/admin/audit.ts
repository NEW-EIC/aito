/**
 * Admin-side audit log helper. Modelled on `lib/auth/audit.ts` so we use
 * one table (`audit_log_entries`) with consistent shape for both auth
 * events and admin actions — a future audit-viewer UI is one query.
 *
 * Every server action that performs an admin write MUST call this.
 * Drop-on-the-floor failures are NOT okay here (compliance keeps these
 * rows), so we don't try/catch the write — let it throw and bubble.
 */

import { headers } from "next/headers";
import { prisma, ActorType, type Prisma } from "@aito/database";

export type AdminAction =
  // article lifecycle
  | "article.created"
  | "article.translation.updated"
  | "article.published"
  | "article.unpublished"
  | "article.archived"
  | "article.unarchived"
  | "article.deleted";

interface RecordOptions {
  action: AdminAction;
  /** The User.id of the staff member performing the action. */
  actorId: string;
  /** Logical resource type — e.g. "article". */
  resourceType: string;
  /** Resource primary key (string-coerced; UUIDs render fine). */
  resourceId: string;
  /** Old field values for diff context. Omit for create actions. */
  oldValue?: Prisma.InputJsonValue;
  /** New field values for diff context. Omit for delete actions. */
  newValue?: Prisma.InputJsonValue;
  /** Free-form context (e.g. server action name, correlation id). */
  metadata?: Prisma.InputJsonValue;
}

/** Best-effort client IP / UA capture for the entry — same as auth audit. */
async function captureRequestContext() {
  let ipAddress: string | null = null;
  let userAgent: string | null = null;
  try {
    const h = await headers();
    const xff = h.get("x-forwarded-for");
    ipAddress = xff ? (xff.split(",")[0]?.trim() ?? null) : h.get("x-real-ip");
    userAgent = h.get("user-agent")?.slice(0, 1024) ?? null;
  } catch {
    // headers() throws outside a request scope (e.g. seeds) — fine, skip.
  }
  return { ipAddress, userAgent };
}

export async function recordAuditLog(opts: RecordOptions): Promise<void> {
  const { ipAddress, userAgent } = await captureRequestContext();
  await prisma.auditLogEntry.create({
    data: {
      action: opts.action,
      actorType: ActorType.admin,
      actorId: opts.actorId,
      resourceType: opts.resourceType,
      resourceId: opts.resourceId,
      oldValue: opts.oldValue,
      newValue: opts.newValue,
      metadata: opts.metadata,
      ipAddress,
      userAgent,
    },
  });
}
