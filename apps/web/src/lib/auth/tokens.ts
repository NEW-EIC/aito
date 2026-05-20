import { prisma, AuthTokenPurpose } from "@aito/database";
import type { AuthToken } from "@aito/database";
import { timingSafeEqual } from "node:crypto";
import {
  generateMagicLinkToken,
  generateOtp,
  hashToken,
} from "./crypto";

/** Email verification: 10-min window, 5 attempts. */
export const EMAIL_VERIFICATION_TTL_MS = 10 * 60 * 1000;
export const EMAIL_VERIFICATION_MAX_ATTEMPTS = 5;

/** Password reset: 1-hour window, single-use. */
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export type IssuedToken = {
  /** Plaintext token to send to the user. Never persist this. */
  token: string;
  /** OTP code (6 digits) for flows that need one (verification, OTP). */
  code: string | null;
  row: AuthToken;
};

export async function issueEmailVerificationToken(opts: {
  userId: string | null;
  email: string;
}): Promise<IssuedToken> {
  const token = generateMagicLinkToken();
  const code = generateOtp(6);
  const row = await prisma.authToken.create({
    data: {
      purpose: AuthTokenPurpose.email_verification,
      tokenHash: hashToken(token),
      codeHash: hashToken(code),
      userId: opts.userId,
      identifier: opts.email,
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    },
  });
  return { token, code, row };
}

export async function issuePasswordResetToken(opts: {
  userId: string;
  email: string;
}): Promise<IssuedToken> {
  const token = generateMagicLinkToken();
  const row = await prisma.authToken.create({
    data: {
      purpose: AuthTokenPurpose.password_reset,
      tokenHash: hashToken(token),
      codeHash: null,
      userId: opts.userId,
      identifier: opts.email,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    },
  });
  return { token, code: null, row };
}

/**
 * Atomically claim a token by plaintext value. Returns the row only if
 * THIS call won the race to mark it consumed — concurrent redemptions of
 * the same plaintext get null.
 *
 * Used by magic-link flows (email verification, password reset).
 */
export async function claimTokenByPlaintext(
  token: string,
  purpose: AuthTokenPurpose,
): Promise<AuthToken | null> {
  const tokenHash = hashToken(token);
  const now = new Date();
  const result = await prisma.authToken.updateMany({
    where: {
      tokenHash,
      purpose,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    data: { consumedAt: now },
  });
  if (result.count !== 1) return null;
  return prisma.authToken.findUnique({ where: { tokenHash } });
}

/**
 * Atomically claim a token by (email, OTP code). Increments attempts on
 * miss; once the freshest candidate hits the max-attempts threshold its
 * row is also consumed so subsequent attempts continue to fail until the
 * user requests a new code.
 *
 * Returns the AuthToken row only if THIS call successfully claimed it.
 */
export async function claimTokenByCode(
  email: string,
  code: string,
  purpose: AuthTokenPurpose,
): Promise<AuthToken | null> {
  const candidates = await prisma.authToken.findMany({
    where: {
      identifier: email,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const submittedHash = hashToken(code);
  const submittedBuf = Buffer.from(submittedHash, "hex");

  // Timing-safe compare on each candidate's stored codeHash.
  for (const row of candidates) {
    if (!row.codeHash) continue;
    const storedBuf = Buffer.from(row.codeHash, "hex");
    if (storedBuf.length !== submittedBuf.length) continue;
    if (!timingSafeEqual(storedBuf, submittedBuf)) continue;

    // Match found — try to atomically claim this row.
    const now = new Date();
    const claim = await prisma.authToken.updateMany({
      where: {
        id: row.id,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      data: { consumedAt: now },
    });
    if (claim.count !== 1) return null;
    return prisma.authToken.findUnique({ where: { id: row.id } });
  }

  // No match — burn an attempt on the freshest candidate.
  const freshest = candidates[0];
  if (freshest) {
    const nextAttempts = freshest.attempts + 1;
    if (nextAttempts >= EMAIL_VERIFICATION_MAX_ATTEMPTS) {
      await prisma.authToken.update({
        where: { id: freshest.id },
        data: { attempts: nextAttempts, consumedAt: new Date() },
      });
    } else {
      await prisma.authToken.update({
        where: { id: freshest.id },
        data: { attempts: nextAttempts },
      });
    }
  }
  return null;
}

/**
 * Burn any outstanding tokens of a purpose for a given identifier. Use this
 * before issuing a fresh verification token so the previous code stops
 * working.
 */
export async function invalidateTokensForIdentifier(
  identifier: string,
  purpose: AuthTokenPurpose,
): Promise<void> {
  await prisma.authToken.updateMany({
    where: { identifier, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });
}
