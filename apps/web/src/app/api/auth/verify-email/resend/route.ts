import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma, AuthTokenPurpose } from "@aito/database";
import { rateLimitAuthIp } from "@/lib/auth/rateLimit";
import { verifyCsrf } from "@/lib/auth/csrf";
import { getClientIp, getLocaleFromReferer } from "@/lib/auth/http";
import {
  invalidateTokensForIdentifier,
  issueEmailVerificationToken,
} from "@/lib/auth/tokens";
import { sendVerifyEmail } from "@/lib/email/client";

const Body = z.object({
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
});

export async function POST(req: NextRequest) {
  const csrf = await verifyCsrf(req);
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.error }, { status: csrf.status });
  }

  const ip = await getClientIp();
  const gate = rateLimitAuthIp(ip, "verify-email-resend");
  if (!gate.ok) {
    return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalidEmail" }, { status: 400 });
  }
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // Don't leak whether the email exists. Return ok either way; only send if
  // we actually have an unverified user.
  if (user && !user.emailVerifiedAt) {
    await invalidateTokensForIdentifier(
      email,
      AuthTokenPurpose.email_verification,
    );
    const { token, code } = await issueEmailVerificationToken({
      userId: user.id,
      email,
    });
    const locale = await getLocaleFromReferer();
    await sendVerifyEmail({ to: email, code: code!, magicLinkToken: token, locale });
  }

  return NextResponse.json({ ok: true });
}
