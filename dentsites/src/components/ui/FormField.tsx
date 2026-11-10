import type { ReactNode } from "react";

export const inputClass = (error?: string) =>
  `w-full rounded-xl border bg-paper/50 px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20 ${error ? "border-danger" : "border-line"}`;

export function inputProps(id: string, error?: string) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": `${id}-hint${error ? ` ${id}-error` : ""}`,
    className: inputClass(error),
  };
}

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 text-sm text-danger">
      <svg viewBox="0 0 16 16" className="mt-1 size-3.5 shrink-0" fill="currentColor" aria-hidden="true">
        <path d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 3a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 8 4.5Zm0 7.25a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Z" />
      </svg>
      {error}
    </p>
  );
}

export function Field({
  id,
  label,
  required,
  hint,
  error,
  className = "",
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[0.9375rem] font-semibold text-ink">
          {label}
          {required && (
            <span className="text-accent" aria-hidden="true">
              {" "}
              *
            </span>
          )}
          {required && <span className="sr-only"> (required)</span>}
        </label>
        <span id={`${id}-hint`} className="text-sm text-ink-soft">
          {hint}
        </span>
      </div>
      {children}
      <FieldError id={id} error={error} />
    </div>
  );
}
