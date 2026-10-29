"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { lab } from "@/config/lab";
import { siteConfig } from "@/config/site";
import { Logo } from "./Logo";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onResize = () => window.matchMedia("(min-width: 1024px)").matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled || open ? "border-line/80 bg-paper/90 shadow-[0_8px_30px_-20px_rgb(16_24_28/0.35)] backdrop-blur-md" : "border-transparent bg-paper"
      }`}
    >
      <div className="mx-auto flex h-[var(--header-height)] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Logo className="min-w-0" />
        <nav aria-label="Main" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {lab.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="rounded-full px-3.5 py-2 text-[0.9375rem] text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-4">
          <span className="hidden sm:contents">
            <ButtonLink href="/submit-case" variant="secondary" size="sm" aria-current={pathname === "/submit-case" ? "page" : undefined}>
              Send a case
            </ButtonLink>
          </span>
          <ButtonLink href="/#inquire" size="sm">
            {siteConfig.inquiry.ctaLabel}
          </ButtonLink>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full text-ink hover:bg-ink/5 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              {open ? <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" /> : <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>
      <div id="mobile-menu" hidden={!open} className="border-t border-line/70 bg-paper lg:hidden">
        <nav aria-label="Mobile" className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <ul className="grid gap-1">
            {lab.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-lg text-ink hover:bg-ink/5">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid gap-2 border-t border-line/70 pt-4 sm:hidden">
            <ButtonLink href="/submit-case" variant="secondary" onClick={() => setOpen(false)}>
              Send a case
            </ButtonLink>
          </div>
        </nav>
      </div>
    </header>
  );
}
