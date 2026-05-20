import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma, AuthTokenPurpose } from "@aito/database";
import { rateLimitAuthIp } from "@/lib/auth/rateLimit";
import { verifyCsrf } from "@/lib/auth/csrf";
import { getClientIp } from "@/lib/auth/http";
import {
  claimTokenByCode,
  claimTokenByPlaintext,
} from "@/lib/auth/tokens";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { recordAuthEvent } from "@/lib/auth/audit";

const ByCode = z.object({
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
  code: z.string().regex(/^\d{6}$/),
});

const ByToken = z.object({
  token: z.string().min(20).max(256),
});

export async function POST(req: NextRequest) {
  const csrf = await verifyCsrf(req);
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.error }, { status: csrf.status });
  }

  const ip = await getClientIp();
  const gate = rateLimitAuthIp(ip, "verify-email");
  if (!gate.ok) {
    return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  }

  const json = (await req.json().catch(() => null)) as unknown;
  const byCode = ByCode.safeParse(json);
  const byToken = ByToken.safeParse(json);

  let row = null;
  if (byCode.success) {
    row = await claimTokenByCode(
      byCode.data.email,
      byCode.data.code,
      AuthTokenPurpose.email_verification,
    );
  } else if (byToken.success) {
    row = await claimTokenByPlaintext(
      byToken.data.token,
      AuthTokenPurpose.email_verification,
    );
  } else {
    return NextResponse.json({ error: "invalidCode" }, { status: 400 });
  }

  if (!row) {
    return NextResponse.json({ error: "invalidCode" }, { status: 400 });
  }

  if (!row.userId) {
    return NextResponse.json({ error: "invalidCode" }, { status: 400 });
  }

  // Token row is already marked consumed atomically by claim*().
  await prisma.user.update({
    where: { id: row.userId },
    data: { emailVerifiedAt: new Date() },
  });

  // Auto-signin after verification.
  const { token, expiresAt } = await createSession(row.userId);
  await setSessionCookie(token, expiresAt);

  await recordAuthEvent({
    action: "user.email_verified",
    actorId: row.userId,
    resourceType: "user",
    resourceId: row.userId,
  });

  return NextResponse.json({ ok: true });
}
