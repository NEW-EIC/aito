import { headers } from "next/headers";
import { prisma, ActorType } from "@aito/database";

export type AuthAction =
  | "user.signup"
  | "user.signin.success"
  | "user.signin.failed"
  | "user.signout"
  | "user.email_verified"
  | "user.password_changed"
  | "user.password_reset_requested"
  | "user.password_reset.completed"
  | "user.mfa_enrolled"
  | "user.mfa_challenge.success"
  | "user.mfa_challenge.failed"
  | "user.oauth_linked.google"
  | "user.oauth_linked.apple"
  | "user.oauth_linked.github"
  | "user.account_locked"
  | "user.account_unlocked";

type AuditOptions = {
  action: AuthAction;
  actorId?: string | null;
  actorType?: ActorType;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
};

function redactedIp(ip: string | null): string | null {
  if (!ip) return null;
  // IPv4: keep first 3 octets, mask the last; IPv6: keep first 4 groups.
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts.slice(0, 4).join(":")}::`;
  }
  return ip;
}

export async function recordAuthEvent(opts: AuditOptions): Promise<void> {
  let ipAddress: string | null = null;
  let userAgent: string | null = null;
  try {
    const h = await headers();
    const xff = h.get("x-forwarded-for");
    ipAddress = xff ? (xff.split(",")[0]?.trim() ?? null) : h.get("x-real-ip");
    userAgent = h.get("user-agent")?.slice(0, 1024) ?? null;
  } catch {
    // headers() throws outside a request scope — fine, just skip.
  }

  await prisma.auditLogEntry.create({
    data: {
      action: opts.action,
      actorType: opts.actorType ?? ActorType.user,
      actorId: opts.actorId ?? null,
      resourceType: opts.resourceType ?? null,
      resourceId: opts.resourceId ?? null,
      metadata: opts.metadata
        ? { ...opts.metadata, ip: redactedIp(ipAddress) }
        : ipAddress
          ? { ip: redactedIp(ipAddress) }
          : undefined,
      ipAddress,
      userAgent,
    },
  });
}
