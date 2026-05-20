import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  generateOtp,
  generateMagicLinkToken,
  hashToken,
  checkHaveIBeenPwned,
  safeCompareHex,
  passwordTooShort,
} from "../crypto";

describe("hashPassword / verifyPassword", () => {
  it("produces different hashes for the same input (salted)", async () => {
    const a = await hashPassword("correct horse battery staple");
    const b = await hashPassword("correct horse battery staple");
    expect(a).not.toBe(b);
    expect(a).toMatch(/^\$argon2id\$/);
  });

  it("verifies a correct password", async () => {
    const hash = await hashPassword("DemoPro2026!");
    expect(await verifyPassword("DemoPro2026!", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("DemoPro2026!");
    expect(await verifyPassword("DemoPro2027!", hash)).toBe(false);
  });

  it("returns false for an invalid hash string", async () => {
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
    expect(await verifyPassword("anything", "")).toBe(false);
  });
});

describe("generateSessionToken", () => {
  it("produces 52-char base32 strings", () => {
    const t = generateSessionToken();
    expect(t).toHaveLength(52);
    expect(t).toMatch(/^[a-z2-7]{52}$/);
  });

  it("produces unique values across 10k calls", () => {
    const set = new Set<string>();
    for (let i = 0; i < 10_000; i++) set.add(generateSessionToken());
    expect(set.size).toBe(10_000);
  });
});

describe("generateOtp", () => {
  it("produces 6 digits by default", () => {
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it("can produce 8 digits", () => {
    expect(generateOtp(8)).toMatch(/^\d{8}$/);
  });

  it("varies across calls (no obvious bias)", () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i++) set.add(generateOtp());
    // not testing entropy, just that we're not stuck on one value
    expect(set.size).toBeGreaterThan(900);
  });
});

describe("generateMagicLinkToken", () => {
  it("produces url-safe base64", () => {
    const t = generateMagicLinkToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(t.length).toBeGreaterThanOrEqual(42);
  });

  it("produces unique tokens", () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i++) set.add(generateMagicLinkToken());
    expect(set.size).toBe(1000);
  });
});

describe("hashToken", () => {
  it("produces a 64-char hex sha256", () => {
    const h = hashToken("hello");
    expect(h).toHaveLength(64);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic", () => {
    expect(hashToken("same")).toBe(hashToken("same"));
  });

  it("changes on different input", () => {
    expect(hashToken("a")).not.toBe(hashToken("b"));
  });
});

describe("safeCompareHex", () => {
  it("returns true for identical strings", () => {
    expect(safeCompareHex("abcd1234", "abcd1234")).toBe(true);
  });
  it("returns false for different strings of same length", () => {
    expect(safeCompareHex("abcd1234", "abcd1235")).toBe(false);
  });
  it("returns false for different lengths", () => {
    expect(safeCompareHex("ab", "abcd")).toBe(false);
  });
});

describe("passwordTooShort", () => {
  it("flags short passwords", () => {
    expect(passwordTooShort("short")).toBe(true);
    expect(passwordTooShort("123456789")).toBe(true); // 9
  });
  it("accepts 10+ chars", () => {
    expect(passwordTooShort("1234567890")).toBe(false);
  });
});

describe("checkHaveIBeenPwned", () => {
  // In test mode the implementation uses an inline canonical-list shortcut
  // to avoid network calls — see crypto.ts.
  it("flags a notoriously-leaked password", async () => {
    expect(await checkHaveIBeenPwned("password123")).toBe(true);
    expect(await checkHaveIBeenPwned("password")).toBe(true);
  });

  it("does not flag a random strong-looking string", async () => {
    const random = generateMagicLinkToken();
    expect(await checkHaveIBeenPwned(random)).toBe(false);
  });
});
