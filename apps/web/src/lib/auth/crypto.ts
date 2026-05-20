import { hash as argon2Hash, verify as argon2Verify } from "@node-rs/argon2";
import { base32, base64url } from "oslo/encoding";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

// OWASP 2024 recommendation for argon2id (memoryCost in KiB)
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

export async function hashPassword(plaintext: string): Promise<string> {
  if (typeof plaintext !== "string" || plaintext.length === 0) {
    throw new Error("password required");
  }
  return argon2Hash(plaintext, ARGON2_OPTIONS);
}

export async function verifyPassword(
  plaintext: string,
  hash: string,
): Promise<boolean> {
  if (!hash) return false;
  try {
    return await argon2Verify(hash, plaintext);
  } catch {
    return false;
  }
}

/** 32 random bytes → 52-char base32 (lowercase, no padding). */
export function generateSessionToken(): string {
  const encoded = base32.encode(randomBytes(32), { includePadding: false });
  return encoded.toLowerCase();
}

/** Numeric OTP with N digits (default 6). */
export function generateOtp(digits: 6 | 8 = 6): string {
  // Reject biased modulo: regenerate while the byte is in the un-evenly-
  // sliced top region. For digit-by-digit generation we use one byte per
  // digit and discard bytes >= 250 (250 = 25 * 10, evenly divisible).
  const out: string[] = [];
  while (out.length < digits) {
    const buf = randomBytes(digits * 2);
    for (let i = 0; i < buf.length && out.length < digits; i++) {
      if (buf[i] < 250) out.push(String(buf[i] % 10));
    }
  }
  return out.join("");
}

/** URL-safe base64 of 32 random bytes (used for magic-link tokens). */
export function generateMagicLinkToken(): string {
  return base64url.encode(randomBytes(32), { includePadding: false });
}

/** Hex sha256 — used to fingerprint opaque tokens before persisting. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Constant-time hex-string compare. */
export function safeCompareHex(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

/**
 * HaveIBeenPwned k-anonymity check. Returns true if the password is found
 * in the breach corpus. Network-failure → returns false (fail-open on the
 * client side; we don't want a DNS hiccup to block legitimate signups).
 */
export async function checkHaveIBeenPwned(plaintext: string): Promise<boolean> {
  if (process.env.NODE_ENV === "test" || process.env.AITO_DISABLE_HIBP === "1") {
    // In tests, only flag the canonical examples. Avoid hitting the network.
    return /^(password|password123|qwerty|123456|letmein|admin)$/i.test(plaintext);
  }
  try {
    const sha1 = createHash("sha1").update(plaintext, "utf8").digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "User-Agent": "aito-alto-auth/1.0" },
      // 3s soft timeout
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;
    const text = await res.text();
    for (const line of text.split(/\r?\n/)) {
      const [hashSuffix] = line.split(":");
      if (hashSuffix && hashSuffix.trim().toUpperCase() === suffix) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Validation helpers shared by signup + reset routes. */
export const PASSWORD_MIN_LENGTH = 10;
export function passwordTooShort(plaintext: string): boolean {
  return typeof plaintext !== "string" || plaintext.length < PASSWORD_MIN_LENGTH;
}
