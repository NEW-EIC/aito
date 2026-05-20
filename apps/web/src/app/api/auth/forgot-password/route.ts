import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma, AuthTokenPurpose } from "@aito/database";
import { rateLimitAuthIp } from "@/lib/auth/rateLimit";
import { verifyCsrf } from "@/lib/auth/csrf";
import { getClientIp, getLocaleFromReferer } from "@/lib/auth/http";
import {
  invalidateTokensForIdentifier,
  issuePasswordResetToken,
} from "@/lib/auth/tokens";
import { sendPasswordResetEmail } from "@/lib/email/client";
import { recordAuthEvent } from "@/lib/auth/audit";

const Body = z.object({
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
});

export async function POST(req: NextRequest) {
  const csrf = await verifyCsrf(req);
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.error }, { status: csrf.status });
  }

  const ip = await getClientIp();
  const gate = rateLimitAuthIp(ip, "forgot-password");
  if (!gate.ok) {
    return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalidEmail" }, { status: 400 });
  }
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { credential: true },
  });

  // Don't leak existence: respond ok regardless. Only actually send if the
  // account exists AND has an internal credential row.
  if (user && user.credential && !user.deletedAt) {
    await invalidateTokensForIdentifier(
      email,
      AuthTokenPurpose.password_reset,
    );
    const { token } = await issuePasswordResetToken({
      userId: user.id,
      email,
    });
    const locale = await getLocaleFromReferer();
    await sendPasswordResetEmail({
      to: email,
      resetToken: token,
      locale,
    });
    await recordAuthEvent({
      action: "user.password_reset_requested",
      actorId: user.id,
      metadata: { email },
    });
  }

  return NextResponse.json({ ok: true });
}
