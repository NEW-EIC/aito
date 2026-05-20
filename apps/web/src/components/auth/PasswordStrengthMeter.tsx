"use client";

interface PasswordStrengthMeterProps {
  password: string;
}

function score(pw: string): { level: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { level: 0, label: "—" };
  let s = 0;
  if (pw.length >= 10) s += 1;
  if (pw.length >= 14) s += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s += 1;
  const labels = ["very weak", "weak", "ok", "strong", "very strong"];
  const level = Math.min(4, s) as 0 | 1 | 2 | 3 | 4;
  return { level, label: labels[level] };
}

const COLOR: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-rose-500",
  1: "bg-rose-400",
  2: "bg-amber-400",
  3: "bg-emerald-500",
  4: "bg-emerald-600",
};

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { level, label } = score(password);
  const filled = level + (password ? 1 : 0);
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded ${i < filled ? COLOR[level] : "bg-border"}`}
          />
        ))}
      </div>
      <span className="mt-1 block text-[11px] uppercase tracking-wide text-fg-soft">
        {label}
      </span>
    </div>
  );
}
