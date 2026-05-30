import { describe, it, expect } from "vitest";
import { suggestSlug } from "./slug";

describe("suggestSlug", () => {
  it("lowercases and dash-joins plain ASCII titles", () => {
    expect(suggestSlug("The Yield Curve Un-Inverted")).toBe(
      "the-yield-curve-un-inverted",
    );
  });

  it("drops punctuation and collapses dash runs", () => {
    expect(suggestSlug("S&P 500: what's next?!")).toBe("s-p-500-what-s-next");
  });

  it("trims leading and trailing dashes", () => {
    expect(suggestSlug("--- hello ---")).toBe("hello");
  });

  it("caps at 80 chars", () => {
    const longTitle = "a".repeat(200);
    expect(suggestSlug(longTitle).length).toBeLessThanOrEqual(80);
  });

  it("falls back to article-<id> for pure CJK titles", () => {
    const slug = suggestSlug("收益率曲线再度恢复正常");
    expect(slug.startsWith("article-")).toBe(true);
    expect(slug.length).toBe("article-".length + 6);
  });

  it("falls back to article-<id> for emoji-only titles", () => {
    const slug = suggestSlug("📊📈");
    expect(slug.startsWith("article-")).toBe(true);
  });

  it("mixed CJK + ASCII keeps the ASCII part", () => {
    expect(suggestSlug("Q3 outlook 三季度展望")).toBe("q3-outlook");
  });

  it("two different empty-suggested calls return different ids", () => {
    const a = suggestSlug("纯中文标题");
    const b = suggestSlug("另一个纯中文标题");
    expect(a).not.toBe(b);
  });
});
