import { siteConfig } from "@/config/site";

/**
 * Marks sample content on the fictional demo. Renders nothing on a real
 * clinic's site (`demo: false` in src/config/site.ts).
 */
export function SampleTag({ children = "Sample", tone = "light", className = "" }: { children?: string; tone?: "light" | "dark"; className?: string }) {
  if (!siteConfig.demo) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide whitespace-nowrap ${
        tone === "dark" ? "bg-white/10 text-white/80 ring-1 ring-white/15" : "bg-warm/10 text-warm ring-1 ring-warm/25"
      } ${className}`}
    >
      <span className={`size-1.5 rounded-full ${tone === "dark" ? "bg-sage" : "bg-warm"}`} aria-hidden="true" />
      {children}
    </span>
  );
}

/** A sentence-length notice that content is sample material. Hidden on a real clinic's site. */
export function SampleNotice({ children, tone = "light", className = "" }: { children: string; tone?: "light" | "dark"; className?: string }) {
  if (!siteConfig.demo) return null;
  return (
    <p className={`flex items-start gap-2.5 text-sm ${tone === "dark" ? "text-white/65" : "text-ink-soft"} ${className}`}>
      <span className={`mt-2 size-1.5 shrink-0 rounded-full ${tone === "dark" ? "bg-sage" : "bg-warm"}`} aria-hidden="true" />
      {children}
    </p>
  );
}
