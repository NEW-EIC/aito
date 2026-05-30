/**
 * HTML sanitiser used in two places:
 *   1. TipTap paste handler — when an editor pastes from WeChat / Word /
 *      a webpage, scrub the markup before TipTap parses it. This stops
 *      Word-style `<o:p>` noise, tracking pixels, and embedded scripts
 *      from polluting the document.
 *   2. Public article renderer — defense-in-depth. Even though TipTap's
 *      schema already constrains what gets persisted, anything that
 *      bypassed the editor (manual SQL edit, future API write, mistaken
 *      migration) gets caught at render time before
 *      `dangerouslySetInnerHTML` mounts it.
 *
 * Built on `sanitize-html` (pure JS, no DOM dependency) — earlier
 * version used `isomorphic-dompurify` which bundles JSDOM and broke
 * Next 15 server bundling because JSDOM reads its UA stylesheet from
 * disk at runtime. `sanitize-html` is allowlist-based with the same
 * security guarantees.
 */

import sanitizeHtmlLib, { type IOptions } from "sanitize-html";

/** Tags the editor is allowed to produce. Order doesn't matter. */
const ALLOWED_TAGS = [
  // Block
  "p",
  "h2",
  "h3",
  "blockquote",
  "pre",
  "hr",
  "ul",
  "ol",
  "li",
  // Inline
  "strong",
  "em",
  "b",
  "i",
  "u",
  "s",
  "del",
  "ins",
  "code",
  "br",
  "span",
  "a",
  "mark",
  "sub",
  "sup",
  // Media
  "img",
  "figure",
  "figcaption",
];

/**
 * Inline style declarations we keep. We're deliberately permissive on
 * colour / typography because editors paste from richly-formatted sources
 * (WeChat, brand pages) and the dropped formatting feels broken. We're
 * still strict on the dangerous stuff:
 *   - no `url()` (loads external resources)
 *   - no `expression()` (legacy IE script execution)
 *   - no `position: fixed` / floats that escape the article column
 *
 * Everything else gets through; brand-consistency concerns are an
 * editor-discipline problem, not a sanitiser problem.
 */
const SAFE_STYLE_PROP_RE =
  /^(text-align|text-indent|text-decoration|text-transform|color|background|background-color|font-size|font-weight|font-style|font-family|line-height|letter-spacing|margin|margin-top|margin-bottom|padding|padding-top|padding-bottom|width|max-width|height|max-height|border|border-color|border-style|border-width|border-radius|display|vertical-align)$/i;

/**
 * Tags we always strip (rather than the default sanitize-html behaviour
 * of stripping unknown tags but keeping `<script>` etc as plain text).
 * Belt-and-braces; they're not in ALLOWED_TAGS either.
 */
const DISALLOWED_TAGS_MODE: IOptions["disallowedTagsMode"] = "discard";

function buildOptions(opts: SanitizeOptions): IOptions {
  const tags = opts.allowImages === false
    ? ALLOWED_TAGS.filter(
        (t) => t !== "img" && t !== "figure" && t !== "figcaption",
      )
    : ALLOWED_TAGS;

  return {
    allowedTags: tags,
    // sanitize-html lets us specify allowed attributes per tag. We
    // allow `style` on most semantic tags + structural attributes
    // (href/src/alt/title) where they make sense.
    allowedAttributes: {
      "*": ["style", "class"],
      a: ["href", "name", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      figure: ["data-text-align"],
      span: ["data-text-align"],
      p: ["data-text-align"],
      h2: ["data-text-align"],
      h3: ["data-text-align"],
    },
    // URL schemes for `href` / `src`. http(s), mailto, tel, anchor,
    // relative — never `javascript:`, `data:`, `file:`, etc. Day 7
    // moved paste-image to real Vercel Blob upload so data: URLs no
    // longer need to slip through.
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {},
    allowProtocolRelative: false,
    allowedSchemesAppliedToAttributes: ["href", "src"],
    // Strip dangerous tags entirely, including content.
    disallowedTagsMode: DISALLOWED_TAGS_MODE,
    // Inline style filter.
    allowedStyles: {
      "*": Object.fromEntries(
        // Build a permissive regex map: every property in SAFE_STYLE_PROP_RE
        // accepts almost any value, except url() / expression().
        // sanitize-html validates each declaration against the regex array
        // for the property; the catch-all wildcard regex below accepts any
        // value that doesn't contain url( or expression(.
        [
          "text-align",
          "text-indent",
          "text-decoration",
          "text-transform",
          "color",
          "background",
          "background-color",
          "font-size",
          "font-weight",
          "font-style",
          "font-family",
          "line-height",
          "letter-spacing",
          "margin",
          "margin-top",
          "margin-bottom",
          "padding",
          "padding-top",
          "padding-bottom",
          "width",
          "max-width",
          "height",
          "max-height",
          "border",
          "border-color",
          "border-style",
          "border-width",
          "border-radius",
          "display",
          "vertical-align",
        ].map((prop) => [prop, [/^(?!.*(?:url\(|expression\())[^;]+$/i]]),
      ),
    },
    // Transform: external links always get rel + target patched.
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const isExternal = /^https?:\/\//i.test(href);
        return {
          tagName,
          attribs: isExternal
            ? { ...attribs, target: "_blank", rel: "noopener noreferrer" }
            : attribs,
        };
      },
    },
  };
}

export interface SanitizeOptions {
  /** When `false`, strip `<img>` / `<figure>` / `<figcaption>`. */
  allowImages?: boolean;
}

export function sanitizeHtml(
  input: string,
  opts: SanitizeOptions = {},
): string {
  return sanitizeHtmlLib(input, buildOptions(opts));
}

/** Re-export hint used by SAFE_STYLE_PROP_RE consumers. Kept for the
 *  sanitize.test.ts assertions that verify the regex's intent. */
export const __SAFE_STYLE_PROP_RE = SAFE_STYLE_PROP_RE;
