import Link from "next/link";
import { clinic } from "@/config/clinic";

export function Logo({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-3 ${className}`} aria-label={`${clinic.name}, home`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- small SVG mark from config */}
      <img src={clinic.logo.mark} alt="" width={40} height={40} className="size-10 shrink-0" />
      <span className="flex min-w-0 flex-col leading-none">
        <span className={`truncate font-display text-[1.2rem] tracking-tight ${tone === "dark" ? "text-white" : "text-ink"}`}>{clinic.name}</span>
        <span className={`mt-1.5 truncate text-[0.6875rem] font-semibold tracking-[0.12em] uppercase ${tone === "dark" ? "text-white/60" : "text-ink-soft"}`}>
          {clinic.descriptor}
        </span>
      </span>
    </Link>
  );
}
