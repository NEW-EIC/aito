/**
 * Render an article body. The HTML went through DOMPurify in the editor's
 * paste handler already, but we re-sanitise here so the public renderer
 * never trusts what comes out of the database. Any HTML that bypassed
 * the editor (manual SQL edit, future API write, mistaken migration)
 * gets caught at render time.
 *
 * Why the dynamic import: isomorphic-dompurify lazily loads JSDOM the
 * first time DOMPurify.sanitize() runs in Node. If we import the
 * sanitiser at the top of this module, Next's build-time
 * "collect-page-data" pass evaluates the module and trips on JSDOM
 * trying to read its bundled default stylesheet (which lives outside
 * the .next bundle). Lazy import = JSDOM only loads at request time.
 */

export async function ArticleBody({ html }: { html: string }) {
  const { sanitizeHtml } = await import("@/lib/admin/sanitize");
  const safe = sanitizeHtml(html);
  return (
    <div
      className="tiptap-editor max-w-none text-lg text-fg"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
