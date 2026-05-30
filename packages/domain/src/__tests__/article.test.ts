import { describe, it, expect } from "vitest";
import {
  articleTransition,
  IllegalArticleTransitionError,
  allowedEvents,
  isPublic,
  type Article,
  type ArticleEvent,
} from "../article";

const make = (state: Article["state"], overrides: Partial<Article> = {}): Article => ({
  id: "art_1",
  state,
  ...overrides,
});

describe("articleTransition — Phase A edges", () => {
  it("draft → published on publish, stamps publishedAt", () => {
    const now = new Date("2026-06-01T10:00:00Z");
    const next = articleTransition(make("draft"), { type: "publish" }, now);
    expect(next.state).toBe("published");
    expect(next.publishedAt).toEqual(now);
  });

  it("draft → archived on archive, stamps archivedAt", () => {
    const now = new Date("2026-06-01T10:00:00Z");
    const next = articleTransition(make("draft"), { type: "archive" }, now);
    expect(next.state).toBe("archived");
    expect(next.archivedAt).toEqual(now);
  });

  it("published → draft on unpublish (hot-fix path)", () => {
    const next = articleTransition(
      make("published", { publishedAt: new Date("2026-05-01") }),
      { type: "unpublish" },
    );
    expect(next.state).toBe("draft");
  });

  it("published → archived on archive", () => {
    const now = new Date("2026-06-10");
    const next = articleTransition(
      make("published", { publishedAt: new Date("2026-05-01") }),
      { type: "archive" },
      now,
    );
    expect(next.state).toBe("archived");
    expect(next.archivedAt).toEqual(now);
  });

  it("archived → draft on unarchive, clears archivedAt", () => {
    const next = articleTransition(
      make("archived", {
        archivedAt: new Date("2026-04-01"),
        publishedAt: new Date("2026-03-01"),
      }),
      { type: "unarchive" },
    );
    expect(next.state).toBe("draft");
    expect(next.archivedAt).toBeUndefined();
    // publishedAt is preserved — un-archiving doesn't forget the original publish date
    expect(next.publishedAt).toEqual(new Date("2026-03-01"));
  });
});

describe("articleTransition — publishedAt invariants", () => {
  it("re-publish (after unpublish) keeps the original publishedAt", () => {
    const originalPublish = new Date("2026-05-01T08:00:00Z");
    const article = make("draft", { publishedAt: originalPublish });
    const republished = articleTransition(
      article,
      { type: "publish" },
      new Date("2026-06-15T09:00:00Z"),
    );
    expect(republished.publishedAt).toEqual(originalPublish);
  });

  it("first publish (no prior publishedAt) stamps with `now`", () => {
    const now = new Date("2026-06-15T09:00:00Z");
    const next = articleTransition(make("draft"), { type: "publish" }, now);
    expect(next.publishedAt).toEqual(now);
  });
});

describe("articleTransition — illegal transitions", () => {
  // Spec the entire matrix so any future surprise gets a failing test.
  const illegalCases: Array<{ from: Article["state"]; event: ArticleEvent["type"] }> = [
    { from: "draft", event: "unpublish" },
    { from: "draft", event: "unarchive" },
    { from: "published", event: "publish" },
    { from: "published", event: "unarchive" },
    { from: "archived", event: "publish" },
    { from: "archived", event: "unpublish" },
    { from: "archived", event: "archive" },
  ];

  for (const c of illegalCases) {
    it(`${c.from} --[${c.event}]--> ? throws IllegalArticleTransitionError`, () => {
      expect(() => articleTransition(make(c.from), { type: c.event })).toThrow(
        IllegalArticleTransitionError,
      );
    });
  }

  it("error carries from + event for audit clarity", () => {
    let captured: IllegalArticleTransitionError | null = null;
    try {
      articleTransition(make("archived"), { type: "publish" });
    } catch (err) {
      captured = err as IllegalArticleTransitionError;
    }
    expect(captured).toBeInstanceOf(IllegalArticleTransitionError);
    expect(captured?.from).toBe("archived");
    expect(captured?.event).toBe("publish");
  });
});

describe("articleTransition — Phase B states are stuck on purpose", () => {
  const phaseBStates: Article["state"][] = ["in_review", "legal_review", "scheduled"];
  const events: ArticleEvent["type"][] = ["publish", "unpublish", "archive", "unarchive"];

  for (const state of phaseBStates) {
    for (const event of events) {
      it(`${state} --[${event}]--> throws (Phase A has no edges defined)`, () => {
        expect(() => articleTransition(make(state), { type: event })).toThrow(
          IllegalArticleTransitionError,
        );
      });
    }
  }
});

describe("articleTransition — purity", () => {
  it("does not mutate the input article", () => {
    const article = make("draft");
    const before = JSON.stringify(article);
    articleTransition(article, { type: "publish" });
    expect(JSON.stringify(article)).toBe(before);
  });
});

describe("allowedEvents", () => {
  it("draft can publish or archive", () => {
    expect(allowedEvents("draft").sort()).toEqual(["archive", "publish"]);
  });

  it("published can unpublish or archive", () => {
    expect(allowedEvents("published").sort()).toEqual(["archive", "unpublish"]);
  });

  it("archived can only unarchive", () => {
    expect(allowedEvents("archived")).toEqual(["unarchive"]);
  });

  it("Phase B states have no allowed events", () => {
    expect(allowedEvents("in_review")).toEqual([]);
    expect(allowedEvents("legal_review")).toEqual([]);
    expect(allowedEvents("scheduled")).toEqual([]);
  });
});

describe("isPublic", () => {
  it("only `published` is public-facing in Phase A", () => {
    expect(isPublic("published")).toBe(true);
    expect(isPublic("draft")).toBe(false);
    expect(isPublic("archived")).toBe(false);
    expect(isPublic("in_review")).toBe(false);
    expect(isPublic("legal_review")).toBe(false);
    expect(isPublic("scheduled")).toBe(false);
  });
});
