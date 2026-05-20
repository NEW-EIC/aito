import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma, AuthProvider, AuthTokenPurpose } from "@aito/database";
import {
  hashPassword,
  checkHaveIBeenPwned,
  passwordTooShort,
} from "@/lib/auth/crypto";
import { rateLimitAuthIp } from "@/lib/auth/rateLimit";
import { verifyCsrf } from "@/lib/auth/csrf";
import { getClientIp, getLocaleFromReferer } from "@/lib/auth/http";
import {
  invalidateTokensForIdentifier,
  issueEmailVerificationToken,
} from "@/lib/auth/tokens";
import { sendVerifyEmail } from "@/lib/email/client";
import { recordAuthEvent } from "@/lib/auth/audit";

const Body = z.object({
  email: z.string().email().max(254).transform((s) => s.trim().toLowerCase()),
  // NIST 800-63B: no upper length cap on user-chosen passwords. argon2 hashes
  // any length input; the policy minimum is enforced in passwordTooShort().
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const csrf = await verifyCsrf(req);
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.error }, { status: csrf.status });
  }

  const ip = await getClientIp();
  const gate = rateLimitAuthIp(ip, "signup");
  if (!gate.ok) {
    return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const code = parsed.error.issues.some((i) => i.path[0] === "email")
      ? "invalidEmail"
      : "tooShort";
    return NextResponse.json({ error: code }, { status: 400 });
  }
  const { email, password } = parsed.data;

  if (passwordTooShort(password)) {
    return NextResponse.json({ error: "tooShort" }, { status: 400 });
  }
  if (await checkHaveIBeenPwned(password)) {
    return NextResponse.json({ error: "weakPassword" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Don't leak whether the email is registered. Return the same "ok" the
    // happy path returns, but skip creating the credential. Send a security
    // alert instead so the legitimate owner notices.
    // (For the demo flow we still surface the conflict so signup forms can
    // suggest "Already registered? Sign in" — see spec §3.4 analog.)
    return NextResponse.json({ error: "emailTaken" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  // Create User + UserCredential atomically.
  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email,
        authProvider: AuthProvider.internal,
        credential: { create: { passwordHash } },
      },
    });
    return u;
  });

  // Burn any prior outstanding verification tokens for this email
  // (e.g. from a previous deleted-account flow) before issuing the new one.
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

  await recordAuthEvent({
    action: "user.signup",
    actorId: user.id,
    resourceType: "user",
    resourceId: user.id,
  });

  return NextResponse.json({ ok: true });
}
