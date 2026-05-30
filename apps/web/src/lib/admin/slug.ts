/**
 * Article slug suggestion. The editor can always override; this is a
 * "save you typing" default, not a security boundary.
 *
 * Rules:
 *   - Lowercase Latin alphanumerics and dashes only
 *   - Strip everything else (CJK / punctuation / emoji)
 *   - Collapse runs of dashes; trim leading/trailing dashes
 *   - Cap at 80 chars (room before the @unique constraint anyway)
 *   - If the result is empty (e.g. title was pure CJK), fall back to
 *     `article-<6 char id>` — readable enough to spot in URLs, unique
 *     enough not to collide.
 */

const FALLBACK_PREFIX = "article-";

export function suggestSlug(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ") // drop CJK / punctuation
    .replace(/\s+/g, "-") // collapse whitespace to dashes
    .replace(/-+/g, "-") // collapse dash runs
    .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
    .slice(0, 80);

  if (cleaned.length === 0) {
    return `${FALLBACK_PREFIX}${randomShortId()}`;
  }
  return cleaned;
}

/** 6 chars, base36, ~2.1B possibilities. Plenty for collision odds. */
function randomShortId(): string {
  // crypto.getRandomValues works in both Node 19+ and edge runtimes.
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  // 32-bit unsigned → base36 → 6 chars, pad if needed.
  const n = (buf[0]! << 24) >>> 0 | (buf[1]! << 16) | (buf[2]! << 8) | buf[3]!;
  return n.toString(36).padStart(6, "0").slice(0, 6);
}
