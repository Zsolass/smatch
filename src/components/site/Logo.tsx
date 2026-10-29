import Link from "next/link";
import { lab } from "@/config/lab";

export function Logo({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label={`${lab.name}, home`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- small SVG mark from config */}
      <img src={lab.logo.mark} alt="" width={36} height={36} className="size-9 shrink-0 transition-transform duration-300 group-hover:-rotate-6" />
      <span className="flex flex-col leading-none">
        <span className={`text-[1.05rem] font-semibold tracking-tight ${tone === "dark" ? "text-white" : "text-ink"}`}>{lab.name}</span>
        <span className={`mt-1 text-[0.7rem] font-medium tracking-wide uppercase ${tone === "dark" ? "text-white/55" : "text-ink-soft"}`}>
          {lab.descriptor}
        </span>
      </span>
    </Link>
  );
}
