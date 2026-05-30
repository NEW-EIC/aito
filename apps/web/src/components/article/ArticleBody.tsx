import { sanitizeHtml } from "@/lib/admin/sanitize";

/**
 * Render an article body. The HTML went through the sanitiser in the
 * editor's paste handler already, but we re-sanitise here so the public
 * renderer never trusts what comes out of the database. Any HTML that
 * bypassed the editor (manual SQL edit, future API write, mistaken
 * migration) gets caught at render time.
 *
 * Earlier this file used a dynamic import to defer JSDOM loading; the
 * Day 6 implementation built on isomorphic-dompurify, which bundled
 * JSDOM and broke Next bundling at runtime (JSDOM reads its UA
 * stylesheet from disk). Swapped to sanitize-html (pure JS, no DOM)
 * in Phase A polish so the import can be plain and synchronous.
 */
export function ArticleBody({ html }: { html: string }) {
  const safe = sanitizeHtml(html);
  return (
    <div
      className="tiptap-editor max-w-none text-lg text-fg"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
