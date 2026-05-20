import { cookies, headers } from "next/headers";
import { prisma } from "@aito/database";
import type { Session, User } from "@aito/database";
import { generateSessionToken, hashToken } from "./crypto";

export const SESSION_COOKIE_NAME = "aito-session";

/** 30 days in ms. */
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
/** Slide the cookie + expires_at row if the existing one is older than this. */
const SLIDING_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function readIp(h: Headers): string | null {
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? null;
  return h.get("x-real-ip");
}

export async function createSession(
  userId: string,
): Promise<{ token: string; expiresAt: Date; session: Session }> {
  const h = await headers();
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress: readIp(h),
      userAgent: h.get("user-agent")?.slice(0, 1024) ?? null,
    },
  });
  return { token, expiresAt, session };
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionFromCookie(): Promise<
  { session: Session; user: User } | null
> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const row = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!row) return null;
  if (row.revokedAt) return null;
  if (row.expiresAt.getTime() <= Date.now()) return null;
  if (row.user.deletedAt) return null;

  // Sliding window: if this session is more than one day old since last
  // refresh, push expiresAt forward another 30 days.
  const remaining = row.expiresAt.getTime() - Date.now();
  if (SESSION_LIFETIME_MS - remaining > SLIDING_THRESHOLD_MS) {
    const newExpiry = new Date(Date.now() + SESSION_LIFETIME_MS);
    await prisma.session.update({
      where: { id: row.id },
      data: { expiresAt: newExpiry },
    });
    await setSessionCookie(token, newExpiry);
    row.expiresAt = newExpiry;
  }
  return { session: row, user: row.user };
}

export async function refreshSession(sessionId: string): Promise<void> {
  const newExpiry = new Date(Date.now() + SESSION_LIFETIME_MS);
  await prisma.session.update({
    where: { id: sessionId },
    data: { expiresAt: newExpiry },
  });
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Convenience: end the current request's session and clear its cookie. */
export async function signOutCurrent(): Promise<void> {
  const current = await getSessionFromCookie();
  if (current) await revokeSession(current.session.id);
  await clearSessionCookie();
}
