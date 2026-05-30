/**
 * HTML sanitiser used in two places:
 *   1. TipTap paste handler — when an editor pastes from WeChat / Word /
 *      a webpage, scrub the markup before TipTap parses it. This stops
 *      Word-style `<o:p>` noise, inline `style="font-family: Helvetica…"`
 *      Microsoft-isms, tracking pixels, and embedded scripts from
 *      polluting the document.
 *   2. Public article renderer — defense-in-depth. Even though TipTap's
 *      schema already constrains what gets persisted, anything that
 *      bypasses the editor (manual SQL edit, future API write, mistaken
 *      migration) gets caught at render time before
 *      `dangerouslySetInnerHTML` mounts it.
 *
 * The allowlist matches the TipTap extension set installed in Day 5
 * exactly. Anything new the editor learns to produce needs an entry
 * here (or the sanitiser will silently strip it).
 *
 * `isomorphic-dompurify` works on Node (JSDOM) and the browser without
 * config; both server components and the client paste handler use it.
 */

import DOMPurify from "isomorphic-dompurify";

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
  "u",
  "s",
  "del",
  "ins",
  "code",
  "br",
  "span",
  "a",
  "mark",
  // Media (Day 7 will add img validation; current schema permits it)
  "img",
  "figure",
  "figcaption",
];

/** Attributes allowed on any tag. Plus per-tag below. */
const ALLOWED_ATTR = [
  "href",
  "target",
  "rel",
  "src",
  "alt",
  "title",
  "class",
  "data-text-align",
  // TipTap's TextAlign extension persists alignment as `style="text-align: …"`
  // so we let `style` through but later HOOK trims it down to safe values.
  "style",
];

/**
 * Style declarations we keep when they appear in a `style=""` attribute.
 * Everything else (font-family, font-size, mso-style-*, line-height when
 * Word-imported, etc.) gets dropped. Keeps the editor's own marks
 * intact while purging WeChat / Word noise.
 */
const ALLOWED_STYLE_PROPS = new Set([
  "text-align",
  "color",
  "background-color",
]);

const URL_SCHEMES_REGEX = /^(https?:|mailto:|tel:|\/|#)/i;

let hooksInstalled = false;
function installHooksOnce() {
  if (hooksInstalled) return;
  hooksInstalled = true;

  // Trim inline styles to the allowlist. DOMPurify lets us mutate
  // attributes during sanitisation.
  DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
    if (data.attrName !== "style") return;
    const raw = data.attrValue ?? "";
    const kept: string[] = [];
    for (const decl of raw.split(";")) {
      const [propRaw, ...valueParts] = decl.split(":");
      const prop = propRaw?.trim().toLowerCase();
      const value = valueParts.join(":").trim();
      if (!prop || !value) continue;
      if (!ALLOWED_STYLE_PROPS.has(prop)) continue;
      // Drop expressions and url() that could fetch external resources.
      if (/expression\(|url\(/i.test(value)) continue;
      kept.push(`${prop}: ${value}`);
    }
    if (kept.length === 0) {
      // Removing the attribute is what an empty kept[] should mean.
      data.attrValue = "";
      data.keepAttr = false;
    } else {
      data.attrValue = kept.join("; ");
    }
  });

  // Validate href / src URL schemes — http(s) / mailto / tel / relative /
  // anchor only. We deliberately reject `data:` URLs even for images
  // because the editor's paste-image handler (Day 7) uploads pasted
  // base64 to Vercel Blob and rewrites the src to a real URL before
  // the document is persisted. A `data:` URL surviving sanitise here
  // would mean the upload failed silently or a non-editor source
  // wrote raw HTML — in either case we'd rather drop the image than
  // bloat every served page with megabytes of base64.
  DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
    if (data.attrName !== "href" && data.attrName !== "src") return;
    const url = (data.attrValue ?? "").trim();
    if (url === "") {
      data.keepAttr = false;
      return;
    }
    if (!URL_SCHEMES_REGEX.test(url)) {
      data.keepAttr = false;
    }
  });

  // External links always get rel and target patched on render. We can't
  // rely on `instanceof Element` because the node comes from isomorphic-
  // dompurify's bundled JSDOM, which doesn't expose Element on globalThis
  // when DOMPurify runs server-side. Duck-typing on `tagName` is enough —
  // hooks only fire for Element-shaped nodes.
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (
      typeof (node as { tagName?: unknown }).tagName !== "string" ||
      typeof (node as { setAttribute?: unknown }).setAttribute !== "function"
    ) {
      return;
    }
    const el = node as unknown as {
      tagName: string;
      getAttribute: (n: string) => string | null;
      setAttribute: (n: string, v: string) => void;
    };
    if (el.tagName !== "A") return;
    const href = el.getAttribute("href") ?? "";
    if (/^https?:/i.test(href)) {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }
  });
}

export interface SanitizeOptions {
  /** When `true`, allow `<img>` tags. Defaults to `true` because the
   *  editor schema permits images and Day 7 wires them up properly. */
  allowImages?: boolean;
}

export function sanitizeHtml(input: string, opts: SanitizeOptions = {}): string {
  installHooksOnce();

  const tags = opts.allowImages === false
    ? ALLOWED_TAGS.filter((t) => t !== "img" && t !== "figure" && t !== "figcaption")
    : ALLOWED_TAGS;

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: tags,
    ALLOWED_ATTR,
    // Forbid form, script, style elements (defaults but make explicit).
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onfocus", "onmouseover"],
    // Drop common Word / Outlook namespaced wrappers entirely.
    KEEP_CONTENT: true,
  });
}
