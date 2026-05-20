import { Check, Minus } from "lucide-react";
import { useTranslations } from "next-intl";

type CellValue = string | boolean | number;

export function PricingComparison() {
  const t = useTranslations("pricing.compare");
  const cols = t.raw("cols") as string[];
  const rows = t.raw("rows") as Array<[string, CellValue, CellValue, CellValue]>;

  function renderCell(v: CellValue) {
    if (v === true) return <Check className="size-4 mx-auto text-accent-600 dark:text-accent-400" />;
    if (v === false || v === "—") return <Minus className="size-4 mx-auto text-fg-soft" />;
    return <span className="text-sm text-fg">{String(v)}</span>;
  }

  return (
    <section className="border-t border-border bg-bg-alt">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h2 className="font-display text-3xl font-semibold mb-8">{t("title")}</h2>
        <div className="rounded-card border border-border bg-surface overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-xs uppercase tracking-wider text-fg-soft font-semibold w-2/5">
                  Feature
                </th>
                {cols.map((c) => (
                  <th
                    key={c}
                    className="p-4 text-xs uppercase tracking-wider text-fg-soft font-semibold text-center"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-rule last:border-0"
                >
                  <td className="p-4 text-sm text-fg-muted">{row[0]}</td>
                  <td className="p-4 text-center">{renderCell(row[1])}</td>
                  <td className="p-4 text-center bg-bg-alt/40">{renderCell(row[2])}</td>
                  <td className="p-4 text-center">{renderCell(row[3])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
