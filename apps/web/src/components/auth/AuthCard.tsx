import { Logo } from "@aito/ui";
import { Link } from "@/i18n/routing";

interface AuthCardProps {
  title: string;
  sub?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, sub, children, footer }: AuthCardProps) {
  return (
    <main
      id="main"
      className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Link href="/" aria-label="AITO home" className="inline-flex">
            <Logo size={56} />
          </Link>
        </div>
        <div className="rounded-card border border-border bg-surface p-8 ring-1 ring-fg/5">
          <h1 className="font-display text-2xl font-semibold text-fg">{title}</h1>
          {sub ? (
            <p className="mt-2 text-sm text-fg-muted leading-relaxed">{sub}</p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>
        {footer ? (
          <p className="mt-6 text-center text-sm text-fg-soft">{footer}</p>
        ) : null}
      </div>
    </main>
  );
}
