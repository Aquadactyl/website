"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

/**
 * The frame every interactive piece in the docs sits in: a title, one line that
 * says what to do with it, and the widget itself.
 */
export function Widget({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="not-prose border-fd-border/70 bg-fd-card/60 my-8 overflow-hidden rounded-xl border shadow-xs backdrop-blur-xs">
      <header className="border-fd-border/50 bg-fd-muted/20 flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
        <div className="min-w-0">
          <p className="text-fd-foreground text-base font-semibold tracking-tight">
            {title}
          </p>
          {description && (
            <p className="text-fd-muted-foreground mt-0.5 text-xs">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** A small uppercase label above a group of controls. */
export function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-fd-muted-foreground mb-2 text-[11px] font-semibold tracking-wider uppercase">
      {children}
    </p>
  );
}

/** Pick one of a few options. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: ReactNode }>;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="inline-block max-w-full overflow-x-auto align-middle">
      <div
        role="radiogroup"
        aria-label={label}
        className="border-fd-border/80 bg-fd-muted/30 flex h-8 w-max items-stretch gap-0.5 rounded-lg border p-0.5"
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={`focus-visible:outline-fd-primary rounded-md px-3 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline ${
                active
                  ? "border-fd-border bg-fd-background text-fd-foreground ring-fd-border/60 border shadow-xs ring-1"
                  : "text-fd-muted-foreground hover:bg-fd-accent/30 hover:text-fd-foreground"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** A single-line text field. */
export function TextField({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      spellCheck={false}
      autoComplete="off"
      {...props}
      className={`border-fd-border/80 bg-fd-background/50 text-fd-foreground placeholder:text-fd-muted-foreground/40 hover:border-fd-border focus:border-fd-primary focus:bg-fd-background focus:ring-fd-primary/30 h-8 w-full rounded-lg border px-3 font-mono text-xs transition-colors focus:ring-1 focus:outline-none ${className}`}
    />
  );
}

/** A plain button in the widget style. `primary` takes the accent. */
export function Button({
  children,
  onClick,
  primary = false,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
        primary
          ? "bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90"
          : "border-fd-border/80 bg-fd-background/50 text-fd-muted-foreground hover:border-fd-primary/50 hover:bg-fd-accent/30 hover:text-fd-foreground border"
      }`}
    >
      {children}
    </button>
  );
}

/** Monospace output, for rendered commands and results. */
export function Output({ children }: { children: ReactNode }) {
  return (
    <pre className="border-fd-border/80 bg-fd-muted/20 text-fd-foreground overflow-x-auto rounded-lg border p-4 font-mono text-xs leading-relaxed">
      {children}
    </pre>
  );
}
