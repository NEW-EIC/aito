import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma, AuthTokenPurpose } from "@aito/database";
import {
  checkHaveIBeenPwned,
  hashPassword,
  passwordTooShort,
} from "@/lib/auth/crypto";
import { rateLimitAuthIp } from "@/lib/auth/rateLimit";
import { verifyCsrf } from "@/lib/auth/csrf";
import { getClientIp } from "@/lib/auth/http";
import { claimTokenByPlaintext } from "@/lib/auth/tokens";
import {
  createSession,
  revokeAllSessionsForUser,
  setSessionCookie,
} from "@/lib/auth/session";
import { recordAuthEvent } from "@/lib/auth/audit";

const Body = z.object({
  token: z.string().min(20).max(256),
  // NIST 800-63B: no upper length cap on user-chosen passwords.
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const csrf = await verifyCsrf(req);
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.error }, { status: csrf.status });
  }

  const ip = await getClientIp();
  const gate = rateLimitAuthIp(ip, "reset-password");
  if (!gate.ok) {
    return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "expiredToken" }, { status: 400 });
  }
  const { token, password } = parsed.data;

  if (passwordTooShort(password)) {
    return NextResponse.json({ error: "tooShort" }, { status: 400 });
  }
  if (await checkHaveIBeenPwned(password)) {
    return NextResponse.json({ error: "weakPassword" }, { status: 400 });
  }

  // Atomically claim the reset token — the row is marked consumed before
  // any other side effects, so a concurrent submission of the same link
  // can't replay it.
  const row = await claimTokenByPlaintext(
    token,
    AuthTokenPurpose.password_reset,
  );
  if (!row || !row.userId) {
    return NextResponse.json({ error: "expiredToken" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    await tx.userCredential.upsert({
      where: { userId: row.userId! },
      update: {
        passwordHash,
        failedAttempts: 0,
        lockedUntil: null,
        lastVerifiedAt: new Date(),
        mustChange: false,
      },
      create: {
        userId: row.userId!,
        passwordHash,
      },
    });
    // Ensure email is treated as verified after a successful reset — the
    // user demonstrated control of the inbox.
    await tx.user.update({
      where: { id: row.userId! },
      data: { emailVerifiedAt: new Date() },
    });
  });

  // Invalidate every other session and start a fresh one for this device.
  await revokeAllSessionsForUser(row.userId);
  const { token: sessionToken, expiresAt } = await createSession(row.userId);
  await setSessionCookie(sessionToken, expiresAt);

  await recordAuthEvent({
    action: "user.password_changed",
    actorId: row.userId,
    resourceType: "user",
    resourceId: row.userId,
  });
  await recordAuthEvent({
    action: "user.password_reset.completed",
    actorId: row.userId,
    resourceType: "user",
    resourceId: row.userId,
  });

  return NextResponse.json({ ok: true });
}
