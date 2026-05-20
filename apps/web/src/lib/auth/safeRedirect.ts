/**
 * Sanitize a post-auth `redirectTo` parameter. Reject anything that could
 * escape this origin — absolute URLs, protocol-relative (//), backslash
 * normalization (\\), and missing leading slash. Default to "/dashboard".
 */
export function sanitizeRedirectTo(input: string | undefined | null): string {
  const fallback = "/dashboard";
  if (!input || typeof input !== "string") return fallback;
  if (input.length > 2048) return fallback;

  // Must start with a single "/" and the next char must NOT be "/" or "\".
  if (!input.startsWith("/")) return fallback;
  if (input.startsWith("//") || input.startsWith("/\\")) return fallback;
  if (input.includes("\\")) return fallback;

  // Disallow control chars (0x00–0x1F, 0x7F) — header / response-splitting.
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    if (c <= 0x1f || c === 0x7f) return fallback;
  }
  return input;
}

/**
 * Variant that preserves the locale prefix the user is currently on. Pass
 * a sanitized relative path and a locale; if the path doesn't already start
 * with `/{locale}/`, prepend it.
 */
export function withLocale(path: string, locale: string): string {
  if (path.startsWith(`/${locale}/`) || path === `/${locale}`) return path;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}
