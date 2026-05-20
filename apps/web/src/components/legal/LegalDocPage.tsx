import { prisma, Locale, LegalDocumentKey } from "@aito/database";

interface LegalDocPageProps {
  docKey: LegalDocumentKey;
  /** App locale: "en" | "zh-CN" | "zh-HK". Mapped to the DB Locale enum. */
  locale: string;
  /** Fallback title if no document row exists yet. */
  fallbackTitle: string;
  /** Fallback body (rendered as plain paragraphs) when no row exists. */
  fallbackBody: string[];
}

function mapLocale(appLocale: string): Locale {
  // The DB enum has en / zh_CN / zh_TW. HK shares the traditional doc with
  // zh_TW until we author a HK-specific version.
  if (appLocale === "zh-CN") return Locale.zh_CN;
  if (appLocale === "zh-HK" || appLocale === "zh-TW") return Locale.zh_TW;
  return Locale.en;
}

/**
 * Resolve the most recent published version of a legal document and render
 * it. Falls back to a hard-coded placeholder when nothing is in the table —
 * useful in dev before legal has signed off on copy.
 */
export async function LegalDocPage({
  docKey,
  locale,
  fallbackTitle,
  fallbackBody,
}: LegalDocPageProps) {
  const dbLocale = mapLocale(locale);
  const row = await prisma.legalDocument
    .findFirst({
      where: { key: docKey, locale: dbLocale, publishedAt: { not: null } },
      orderBy: { effectiveAt: "desc" },
    })
    .catch(() => null);

  const title = row?.title ?? fallbackTitle;
  const paragraphs = row
    ? row.bodyMdx.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    : fallbackBody;
  const version = row?.version;
  const effective = row?.effectiveAt;

  return (
    <main id="main" className="container mx-auto px-4 py-14 max-w-article">
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-fg">
        {title}
      </h1>
      {version || effective ? (
        <p className="mt-2 text-sm text-fg-soft">
          {version ? <span className="font-mono">{version}</span> : null}
          {version && effective ? " · " : null}
          {effective
            ? `effective ${effective.toISOString().slice(0, 10)}`
            : null}
        </p>
      ) : null}
      <div className="mt-8 space-y-5 text-fg leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <p className="mt-12 text-xs text-fg-soft">
        Questions? Email{" "}
        <a
          href="mailto:legal@aito-alto.com"
          className="underline-offset-4 hover:underline"
        >
          legal@aito-alto.com
        </a>
        .
      </p>
    </main>
  );
}
