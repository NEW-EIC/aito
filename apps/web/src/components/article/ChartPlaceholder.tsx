import { curve2s10s, curveLabels } from "@/lib/marketData";

/**
 * Pure-SVG line chart for the 2s10s curve. No JS library, no canvas — just
 * an `<svg>` with a polyline + area fill. Looks like a real chart at a
 * glance; built from `curve2s10s` data in lib/marketData.
 */
export function ChartPlaceholder({ caption }: { caption: string }) {
  const series = curve2s10s;
  const w = 720;
  const h = 280;
  const padL = 48;
  const padR = 16;
  const padT = 24;
  const padB = 32;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;

  const stepX = innerW / (series.length - 1);
  const pts = series.map((v, i) => {
    const x = padL + i * stepX;
    const y = padT + innerH - ((v - min) / range) * innerH;
    return [x, y];
  });

  const polyline = pts.map((p) => p.join(",")).join(" ");
  const area =
    `M ${pts[0][0]},${padT + innerH} ` +
    pts.map((p) => `L ${p[0]},${p[1]}`).join(" ") +
    ` L ${pts[pts.length - 1][0]},${padT + innerH} Z`;

  // Zero line
  const zeroY = padT + innerH - ((0 - min) / range) * innerH;

  return (
    <figure className="my-8">
      <div className="rounded-card border border-border bg-surface p-4">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          role="img"
          aria-label={caption}
        >
          {/* Y-axis grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <line
              key={p}
              x1={padL}
              x2={w - padR}
              y1={padT + innerH * p}
              y2={padT + innerH * p}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-border opacity-50"
            />
          ))}
          {/* Zero line */}
          <line
            x1={padL}
            x2={w - padR}
            y1={zeroY}
            y2={zeroY}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 3"
            className="text-fg-soft opacity-60"
          />
          {/* Area fill */}
          <path d={area} fill="rgb(var(--accent-sem))" opacity="0.12" />
          {/* Line */}
          <polyline
            points={polyline}
            fill="none"
            stroke="rgb(var(--accent-sem))"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* End-of-line dot */}
          <circle
            cx={pts[pts.length - 1][0]}
            cy={pts[pts.length - 1][1]}
            r="4"
            fill="rgb(var(--accent-sem))"
          />
          {/* X-axis labels (sparse, every ~6 months) */}
          {curveLabels.map((lbl, i) => (
            <text
              key={lbl}
              x={padL + (innerW / (curveLabels.length - 1)) * i}
              y={h - 8}
              textAnchor="middle"
              className="fill-fg-soft text-[10px] font-mono"
            >
              {lbl}
            </text>
          ))}
        </svg>
      </div>
      <figcaption className="mt-3 text-xs text-fg-soft text-center font-mono">
        {caption}
      </figcaption>
    </figure>
  );
}
