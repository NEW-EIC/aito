/**
 * Strip HTML tags + entities cheaply (no DOM parse) and count words.
 * "Words" defined as runs of CJK characters (each counted individually,
 * the way zhihu / weibo count) or runs of non-CJK non-whitespace.
 *
 * Reading time: industry-standard 250 wpm for English; CJK halved to
 * 500 cpm because reading rate per character is roughly 2x.
 */

const HTML_TAG_RE = /<[^>]+>/g;
const HTML_ENTITY_RE = /&(?:#\d+|#x[0-9a-f]+|[a-z]+);/gi;
// Roughly matches Han / Hiragana / Katakana / Hangul ranges.
const CJK_RE = /[㐀-鿿぀-ヿ가-힯]/g;
const NON_CJK_WORD_RE = /[^\s㐀-鿿぀-ヿ가-힯]+/g;

export interface WordCountResult {
  cjkChars: number;
  latinWords: number;
  totalUnits: number;
  /** Minutes (rounded up to at least 1) for an editorial reading pace. */
  readingMinutes: number;
}

export function countWords(html: string): WordCountResult {
  const text = html
    .replace(HTML_TAG_RE, " ")
    .replace(HTML_ENTITY_RE, " ")
    .trim();
  const cjk = text.match(CJK_RE)?.length ?? 0;
  // Subtract CJK runs first so we don't double-count e.g. "A股" as
  // "A股" + a CJK char.
  const latinPart = text.replace(CJK_RE, " ");
  const latin = latinPart.match(NON_CJK_WORD_RE)?.length ?? 0;
  const totalUnits = cjk + latin;
  // 250 wpm Latin + 500 cpm CJK (~halved per-character pace because each
  // character carries more meaning than a Latin word).
  const minutes = latin / 250 + cjk / 500;
  return {
    cjkChars: cjk,
    latinWords: latin,
    totalUnits,
    readingMinutes: totalUnits === 0 ? 0 : Math.max(1, Math.ceil(minutes)),
  };
}
