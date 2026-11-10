import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "light" | "outline-light" | "inquire" | "pop";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-55 select-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white shadow-[0_10px_24px_-14px_var(--color-accent)] hover:bg-accent-strong",
  secondary: "border border-ink/20 bg-surface/70 text-ink hover:border-ink/40 hover:bg-surface",
  ghost: "text-ink hover:bg-ink/5",
  light: "bg-paper text-night hover:bg-white",
  "outline-light": "border border-white/35 text-white hover:border-white/70 hover:bg-white/10",
  // The clinic-owner action: coral, so it is never mistaken for booking.
  inquire: "bg-coral text-night shadow-[0_10px_24px_-14px_var(--color-coral)] hover:brightness-105",
  pop: "bg-pop text-night hover:brightness-105",
};

// Every size is at least 44px tall: a comfortable touch target.
const sizes: Record<ButtonSize, string> = {
  sm: "h-11 px-5 text-[0.9375rem]",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-8 text-[1.0625rem]",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

interface Common {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({ variant, size, className = "", ...props }: Common & ComponentProps<typeof Link>) {
  return <Link {...props} className={buttonClass(variant, size, className)} />;
}

export function Button({ variant, size, className = "", type = "button", ...props }: Common & ComponentProps<"button">) {
  return <button type={type} {...props} className={buttonClass(variant, size, className)} />;
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`size-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
