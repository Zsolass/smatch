"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { clinic, hasMultipleLocations, mainLocation } from "@/config/clinic";
import { siteConfig } from "@/config/site";
import { enabledTreatments } from "@/config/treatments";
import { BookingLink } from "./BookingLink";
import { InquireLink } from "./InquireLink";
import { Logo } from "./Logo";

/** Practical information above the header: only what the clinic has supplied. */
function InfoBar() {
  const loc = mainLocation;
  return (
    <div className="hidden border-b border-line/70 bg-paper-deep/60 text-[0.8125rem] text-ink-soft lg:block">
      <div className="mx-auto flex h-9 max-w-7xl items-center gap-6 px-8">
        {hasMultipleLocations ? (
          <Link href="/#contact" className="inline-flex items-center gap-1.5 hover:text-ink">
            <Icon name="pin" className="size-4" />
            {clinic.locations.length} locations: {clinic.locations.map((l) => l.name).join(", ")}
          </Link>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="pin" className="size-4" />
              {loc.address.join(", ")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" className="size-4" />
              {loc.hoursSummary}
            </span>
            {loc.parking && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="car" className="size-4" />
                {loc.parking}
              </span>
            )}
          </>
        )}
        <a href={loc.phoneHref} className="ml-auto inline-flex items-center gap-1.5 font-semibold text-ink hover:text-accent min-[1560px]:hidden" data-analytics="call_click" data-placement="info-bar">
          <Icon name="phone" className="size-4" />
          <span className="sr-only">Call </span>
          {loc.phone}
        </a>
        <span className="ml-auto hidden min-[1560px]:inline">{clinic.hero.points[0]}</span>
      </div>
    </div>
  );
}

const navLink = "rounded-full px-3 py-2.5 text-base whitespace-nowrap text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink";

/** "Treatments" opens a panel that lists every treatment page. */
function TreatmentsMenu({ label, href }: { label: string; href: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      ref.current?.querySelector("button")?.focus();
    };
    const onPointer = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <li ref={ref} className="relative" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setOpen(false)}>
      <button type="button" aria-expanded={open} aria-controls="treatments-menu" onClick={() => setOpen((o) => !o)} className={`${navLink} inline-flex items-center gap-1.5`}>
        {label}
        <svg viewBox="0 0 16 16" className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div id="treatments-menu" hidden={!open} className="absolute top-full left-1/2 z-50 mt-3 w-[34rem] -translate-x-1/2 rounded-[var(--radius-card)] border border-line bg-surface p-3 shadow-[var(--shadow-lift)]">
        <ul className="grid grid-cols-2 gap-1">
          {enabledTreatments.map((t) => (
            <li key={t.id}>
              <Link href={`/treatments/${t.id}`} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 transition-colors hover:bg-accent-soft/60">
                <span className="block font-semibold text-ink">{t.name}</span>
                <span className="mt-0.5 block text-sm text-ink-soft">{t.need.title}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href={href} onClick={() => setOpen(false)} className="mt-2 flex items-center justify-between gap-2 rounded-xl border-t border-line px-4 pt-4 pb-2 text-[0.9375rem] font-semibold text-accent hover:underline">
          Find the right treatment by what you have noticed <Arrow />
        </Link>
      </div>
    </li>
  );
}

export function SiteHeader({ actionBar = true }: { actionBar?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onResize = () => window.matchMedia("(min-width: 1280px)").matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const loc = mainLocation;
  const pathname = usePathname();
  const onBookingPage = pathname.startsWith(siteConfig.booking.path);
  const onInquiryPage = pathname.startsWith(siteConfig.inquiry.path);

  return (
    <>
      <InfoBar />
      <header
        className={`sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300 ${
          scrolled || open ? "border-line/80 bg-paper/92 shadow-[0_10px_30px_-22px_rgb(28_34_30/0.45)] backdrop-blur-md" : "border-transparent bg-paper"
        }`}
      >
        <div className="mx-auto flex h-[var(--header-height)] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Logo className="min-w-0" />
          <nav aria-label="Main" className="ml-auto hidden xl:block">
            <ul className="flex items-center">
              {clinic.nav.map((item) =>
                item.href === "/#treatments" && enabledTreatments.length > 0 ? (
                  <TreatmentsMenu key={item.href} label={item.label} href={item.href} />
                ) : (
                  <li key={item.href}>
                    <Link href={item.href} className={navLink}>
                      {item.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-3">
            <a href={loc.phoneHref} className="mr-2 hidden items-center gap-2 text-base font-semibold whitespace-nowrap text-ink hover:text-accent min-[1560px]:inline-flex" data-analytics="call_click" data-placement="header">
              <Icon name="phone" className="size-[1.125rem] text-accent" />
              <span className="sr-only">Call </span>
              {loc.phone}
            </a>
            {/* On phones, booking and calling stay visible in the bar at the bottom of the screen instead. */}
            {/* Each button is left out where it would only lead to the page you are on. */}
            <span className={actionBar || onBookingPage ? "hidden sm:contents" : "contents"}>
              <BookingLink placement="header" size="sm" className="max-[400px]:px-3.5 max-[400px]:text-sm" />
            </span>
            {!onInquiryPage && <InquireLink size="sm" className="px-4 max-[400px]:px-3.5 max-[400px]:text-sm" />}
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full text-ink hover:bg-ink/5 xl:hidden"
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
        <div id="mobile-menu" hidden={!open} className="max-h-[calc(100dvh-var(--header-height))] overflow-y-auto border-t border-line/70 bg-paper xl:hidden">
          <nav aria-label="Mobile" className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <ul className="grid gap-1">
              {clinic.nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 font-display text-2xl text-ink hover:bg-ink/5">
                    {item.label}
                  </Link>
                  {item.href === "/#treatments" && (
                    <ul className="mb-2 grid gap-0.5 border-l border-line pl-3 ml-3">
                      {enabledTreatments.map((t) => (
                        <li key={t.id}>
                          <Link href={`/treatments/${t.id}`} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-base text-ink-soft hover:bg-ink/5 hover:text-ink">
                            {t.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-3 border-t border-line/70 pt-5 text-[0.9375rem] text-ink-soft">
              <a href={loc.phoneHref} className="inline-flex items-center gap-2.5 py-1 font-semibold text-ink" data-analytics="call_click" data-placement="mobile-menu">
                <Icon name="phone" className="size-5 text-accent" />
                <span className="sr-only">Call </span>
                {loc.phone}
              </a>
              <p className="flex items-start gap-2.5">
                <Icon name="pin" className="mt-0.5 size-5 shrink-0 text-accent" />
                {loc.address.join(", ")}
              </p>
              <p className="flex items-start gap-2.5">
                <Icon name="clock" className="mt-0.5 size-5 shrink-0 text-accent" />
                {loc.hoursSummary}
              </p>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
