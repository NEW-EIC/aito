import { describe, it, expect } from "vitest";
import {
  sanitizeRedirectTo,
  withLocale,
  stripLocale,
} from "../safeRedirect";

describe("sanitizeRedirectTo", () => {
  it("returns the input when it's a clean relative path", () => {
    expect(sanitizeRedirectTo("/dashboard")).toBe("/dashboard");
    expect(sanitizeRedirectTo("/dashboard/billing")).toBe("/dashboard/billing");
  });

  it("falls back to /dashboard on absolute / protocol-relative / dirty input", () => {
    expect(sanitizeRedirectTo("https://evil.com")).toBe("/dashboard");
    expect(sanitizeRedirectTo("//evil.com")).toBe("/dashboard");
    expect(sanitizeRedirectTo("/\\evil")).toBe("/dashboard");
    expect(sanitizeRedirectTo("no-leading-slash")).toBe("/dashboard");
    expect(sanitizeRedirectTo(undefined)).toBe("/dashboard");
    expect(sanitizeRedirectTo(null)).toBe("/dashboard");
  });
});

describe("withLocale", () => {
  it("prepends locale to a locale-less path", () => {
    expect(withLocale("/dashboard", "zh-CN")).toBe("/zh-CN/dashboard");
    expect(withLocale("/", "en")).toBe("/en");
  });

  it("leaves paths that already carry the locale alone", () => {
    expect(withLocale("/zh-CN/dashboard", "zh-CN")).toBe("/zh-CN/dashboard");
    expect(withLocale("/zh-CN", "zh-CN")).toBe("/zh-CN");
  });
});

describe("stripLocale", () => {
  it("removes any known locale prefix", () => {
    expect(stripLocale("/zh-CN/dashboard")).toBe("/dashboard");
    expect(stripLocale("/en/pricing")).toBe("/pricing");
    expect(stripLocale("/zh-HK/dashboard/billing")).toBe("/dashboard/billing");
  });

  it("turns a locale-only path into /", () => {
    expect(stripLocale("/zh-CN")).toBe("/");
    expect(stripLocale("/en")).toBe("/");
  });

  it("leaves locale-less paths untouched", () => {
    expect(stripLocale("/dashboard")).toBe("/dashboard");
    expect(stripLocale("/")).toBe("/");
  });

  it("doesn't strip strings that merely begin with a locale name as a word", () => {
    expect(stripLocale("/enterprise")).toBe("/enterprise");
    expect(stripLocale("/zh-CNX")).toBe("/zh-CNX");
  });

  it("round-trips with withLocale to prevent double-prefixing", () => {
    const withPrefix = "/zh-CN/dashboard";
    expect(withLocale(stripLocale(withPrefix), "zh-CN")).toBe(withPrefix);
  });
});
