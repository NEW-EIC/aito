import { describe, it, expect } from "vitest";
import { countWords } from "./wordCount";

describe("countWords", () => {
  it("counts Latin words", () => {
    const r = countWords("<p>The yield curve un-inverted today.</p>");
    expect(r.latinWords).toBe(5);
    expect(r.cjkChars).toBe(0);
    expect(r.totalUnits).toBe(5);
  });

  it("counts CJK characters individually", () => {
    // 收益率曲线再度恢复正常 = 11 chars (zh-CN test string).
    const r = countWords("<p>收益率曲线再度恢复正常</p>");
    expect(r.cjkChars).toBe(11);
    expect(r.latinWords).toBe(0);
  });

  it("counts mixed CJK + Latin without double-counting", () => {
    const r = countWords("<p>Q3 outlook 三季度展望</p>");
    expect(r.latinWords).toBe(2); // "Q3", "outlook"
    expect(r.cjkChars).toBe(5);
    expect(r.totalUnits).toBe(7);
  });

  it("strips tags and entities", () => {
    const r = countWords(
      '<p>Two <strong>and a</strong> half&nbsp;words.</p>',
    );
    expect(r.latinWords).toBe(5); // "Two", "and", "a", "half", "words"
  });

  it("computes 1 minute minimum reading time for non-empty content", () => {
    const r = countWords("<p>Just three words.</p>");
    expect(r.readingMinutes).toBe(1);
  });

  it("computes 0 minutes for empty content", () => {
    expect(countWords("").readingMinutes).toBe(0);
    expect(countWords("<p></p>").readingMinutes).toBe(0);
  });

  it("scales reading time for longer English content (250 wpm)", () => {
    const r = countWords("<p>" + "word ".repeat(500) + "</p>");
    expect(r.latinWords).toBe(500);
    expect(r.readingMinutes).toBe(2); // 500 / 250
  });

  it("scales reading time for longer CJK content (500 cpm)", () => {
    const r = countWords("<p>" + "字".repeat(1000) + "</p>");
    expect(r.cjkChars).toBe(1000);
    expect(r.readingMinutes).toBe(2); // 1000 / 500
  });
});
