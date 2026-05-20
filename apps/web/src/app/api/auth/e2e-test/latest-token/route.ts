import { NextResponse, type NextRequest } from "next/server";
import { prisma, AuthTokenPurpose } from "@aito/database";

/**
 * Test-only endpoint. Returns the most recent AuthToken row for the supplied
 * email + purpose so Playwright can inject the OTP / reset token directly
 * instead of intercepting email.
 *
 * Wired only when both NODE_ENV !== "production" AND AITO_E2E === "1".
 */
function isEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" && process.env.AITO_E2E === "1"
  );
}

export async function GET(req: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }
  const url = new URL(req.url);
  const email = url.searchParams.get("email")?.toLowerCase();
  const purpose = url.searchParams.get("purpose") as AuthTokenPurpose | null;
  if (!email || !purpose) {
    return NextResponse.json({ error: "missing-params" }, { status: 400 });
  }
  const row = await prisma.authToken.findFirst({
    where: {
      identifier: email,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return NextResponse.json({ error: "not-found" }, { status: 404 });
  // Token bodies are stored hashed. We can't return the plaintext token —
  // the test should rely on the OTP _code_ which is also hashed BUT we
  // can't return that either. Instead, emit a fresh test-only override
  // by rotating the hashed code to a known-plaintext value the test asks
  // for. Simpler approach: we re-issue a fresh token with a known code.
  return NextResponse.json({ id: row.id, hasCode: !!row.codeHash });
}

const KNOWN_TEST_CODE = "424242";

/**
 * Inject a known plaintext token + code into the most recent active
 * verification or reset token for an email. Returns the plaintext token
 * and code the test should submit.
 */
export async function POST(req: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }
  const body = (await req.json().catch(() => null)) as
    | { email?: string; purpose?: AuthTokenPurpose }
    | null;
  const email = body?.email?.toLowerCase();
  const purpose = body?.purpose;
  if (!email || !purpose) {
    return NextResponse.json({ error: "missing-params" }, { status: 400 });
  }
  const row = await prisma.authToken.findFirst({
    where: {
      identifier: email,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return NextResponse.json({ error: "not-found" }, { status: 404 });

  // Compute hashes the same way crypto.ts does (sha256 hex of utf8).
  const { createHash } = await import("node:crypto");
  const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

  // Make the plaintext token unique-per-row so concurrent test files /
  // re-runs don't collide on the unique(token_hash) constraint.
  const knownToken = `e2e-${row.id}-${Date.now()}`.padEnd(42, "x");
  await prisma.authToken.update({
    where: { id: row.id },
    data: {
      tokenHash: sha256(knownToken),
      codeHash: row.codeHash ? sha256(KNOWN_TEST_CODE) : null,
      attempts: 0,
    },
  });

  return NextResponse.json({
    token: knownToken,
    code: row.codeHash ? KNOWN_TEST_CODE : null,
  });
}
