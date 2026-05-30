import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@aito/database";
import { verifyPassword } from "@/lib/auth/crypto";
import {
  ACCOUNT_LOCKOUT_MS,
  ACCOUNT_LOCKOUT_THRESHOLD,
  ACCOUNT_LOCKOUT_WINDOW_MS,
  rateLimitAuthIp,
} from "@/lib/auth/rateLimit";
import { verifyCsrf } from "@/lib/auth/csrf";
import { getClientIp } from "@/lib/auth/http";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { recordAuthEvent } from "@/lib/auth/audit";
import { sendSecurityAlertEmail } from "@/lib/email/client";

const Body = z.object({
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
  // NIST 800-63B: no upper length cap on user-chosen passwords.
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const csrf = await verifyCsrf(req);
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.error }, { status: csrf.status });
  }

  const ip = await getClientIp();
  const gate = rateLimitAuthIp(ip, "signin");
  if (!gate.ok) {
    return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalidCredentials" }, { status: 401 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { credential: true },
  });

  if (!user || !user.credential || user.deletedAt) {
    await recordAuthEvent({
      action: "user.signin.failed",
      actorId: user?.id ?? null,
      metadata: { email, reason: "no-credential" },
    });
    return NextResponse.json({ error: "invalidCredentials" }, { status: 401 });
  }

  if (user.credential.lockedUntil && user.credential.lockedUntil > new Date()) {
    const minutes = Math.ceil(
      (user.credential.lockedUntil.getTime() - Date.now()) / 60_000,
    );
    return NextResponse.json(
      { error: "tooManyAttempts", lockoutMinutes: minutes },
      { status: 423 },
    );
  }

  const ok = await verifyPassword(password, user.credential.passwordHash);
  if (!ok) {
    const now = new Date();
    // Rolling-window failure counting. If the current window has expired
    // (or never started), start a fresh one with a single attempt.
    const windowStart = user.credential.failedWindowStartedAt;
    const inWindow =
      !!windowStart &&
      now.getTime() - windowStart.getTime() < ACCOUNT_LOCKOUT_WINDOW_MS;
    const attempts = inWindow ? user.credential.failedAttempts + 1 : 1;
    const willLock = attempts >= ACCOUNT_LOCKOUT_THRESHOLD;
    await prisma.userCredential.update({
      where: { userId: user.id },
      data: {
        failedAttempts: attempts,
        failedWindowStartedAt: inWindow ? windowStart : now,
        lockedUntil: willLock
          ? new Date(now.getTime() + ACCOUNT_LOCKOUT_MS)
          : user.credential.lockedUntil,
      },
    });
    await recordAuthEvent({
      action: "user.signin.failed",
      actorId: user.id,
      metadata: { reason: "bad-password", attempts },
    });
    if (willLock) {
      await recordAuthEvent({
        action: "user.account_locked",
        actorId: user.id,
        metadata: { attempts },
      });
      const lockoutMinutes = Math.ceil(ACCOUNT_LOCKOUT_MS / 60_000);
      return NextResponse.json(
        { error: "tooManyAttempts", lockoutMinutes },
        { status: 423 },
      );
    }
    return NextResponse.json({ error: "invalidCredentials" }, { status: 401 });
  }

  if (!user.emailVerifiedAt) {
    return NextResponse.json({ error: "unverified" }, { status: 403 });
  }

  // Successful signin — clear the failure window and any expired lockout.
  await prisma.userCredential.update({
    where: { userId: user.id },
    data: {
      failedAttempts: 0,
      failedWindowStartedAt: null,
      lockedUntil: null,
      lastVerifiedAt: new Date(),
    },
  });
  const { token, expiresAt, session } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);

  await recordAuthEvent({
    action: "user.signin.success",
    actorId: user.id,
    resourceType: "session",
    resourceId: session.id,
  });

  // Best-effort security alert (don't block the response on email failure).
  void sendSecurityAlertEmail({
    to: user.email,
    ip: session.ipAddress,
    userAgent: session.userAgent,
    whenIso: new Date(session.createdAt).toISOString(),
  }).catch(() => {});

  // Tell the client whether this user holds any non-revoked, non-expired
  // role grant. The SignInForm uses this to pick the default redirect
  // (staff → /admin, everyone else → /dashboard) when the URL didn't
  // carry an explicit redirectTo. We only need to know IF they have any
  // role, not which one — the /admin layout enforces real permissions.
  const now = new Date();
  const grantCount = await prisma.userRole.count({
    where: {
      userId: user.id,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });

  return NextResponse.json({ ok: true, isStaff: grantCount > 0 });
}
