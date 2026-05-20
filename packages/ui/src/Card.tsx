import type { HTMLAttributes } from "react";
import { cn } from "./utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ hover = false, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface",
        hover && "transition-shadow duration-200 hover:shadow-md",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
