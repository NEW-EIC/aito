import Image from "next/image";
import { cn } from "./utils";

interface LogoProps {
  size?: number;
  showMark?: boolean;
  showWord?: boolean;
  className?: string;
}

export function Logo({ size = 28, showMark = true, showWord = true, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {showMark && (
        <Image
          src="/logo.png"
          alt="AITO"
          width={size}
          height={size}
          priority
          className="shrink-0 dark:invert"
          style={{ width: size, height: size }}
        />
      )}
      {showWord && (
        <span className="inline-flex items-baseline text-fg">
          <span
            className="font-display font-semibold tracking-tight"
            style={{ fontSize: size * 0.7 }}
          >
            AITO
          </span>
        </span>
      )}
    </span>
  );
}
