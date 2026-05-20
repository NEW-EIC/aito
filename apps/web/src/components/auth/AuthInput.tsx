"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@aito/ui";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  function AuthInput({ label, hint, error, className, id, ...rest }, ref) {
    const inputId = id ?? rest.name;
    return (
      <label htmlFor={inputId} className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-fg-soft">
          {label}
        </span>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            "mt-1 block w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-fg",
            "placeholder:text-fg-soft",
            "focus:border-fg focus:outline-none focus:ring-1 focus:ring-fg",
            "disabled:opacity-50",
            error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : "",
            className,
          )}
          {...rest}
        />
        {hint && !error ? (
          <span id={`${inputId}-hint`} className="mt-1 block text-xs text-fg-soft">
            {hint}
          </span>
        ) : null}
        {error ? (
          <span
            id={`${inputId}-error`}
            className="mt-1 block text-xs text-rose-600 dark:text-rose-400"
            role="alert"
          >
            {error}
          </span>
        ) : null}
      </label>
    );
  },
);
