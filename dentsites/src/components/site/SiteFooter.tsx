import Link from "next/link";
import { clinic, mainLocation } from "@/config/clinic";
import { siteConfig } from "@/config/site";
import { enabledTreatments } from "@/config/treatments";
import { bookingHref, usesBookingLink } from "@/lib/booking";
import { Logo } from "./Logo";

export function SiteFooter() {
  const loc = mainLocation;
  const heading = "text-xs font-semibold tracking-[0.14em] text-white/55 uppercase";
  return (
    <footer className="on-dark bg-night text-white/70">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          <div>
            <Logo tone="dark" />
            <p className="mt-6 max-w-xs text-[0.9375rem] text-white/60">{clinic.hero.eyebrow}.</p>
            {siteConfig.demo && <p className="mt-4 max-w-xs text-sm text-white/45">{clinic.sampleNotice}</p>}
          </div>
          <nav aria-label="Treatments">
            <h2 className={heading}>Treatments</h2>
            <ul className="mt-5 grid gap-3 text-[0.9375rem]">
              {enabledTreatments.map((t) => (
                <li key={t.id}>
                  <Link href={`/treatments/${t.id}`} className="hover:text-white">
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Footer">
            <h2 className={heading}>The clinic</h2>
            <ul className="mt-5 grid gap-3 text-[0.9375rem]">
              {clinic.nav
                .filter((item) => item.href !== "/#treatments")
                .map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              <li>
                <Link href="/#faq" className="hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                {usesBookingLink() ? (
                  <a href={bookingHref()} className="hover:text-white" target="_blank" rel="noopener" data-analytics="booking_click" data-placement="footer">
                    {siteConfig.booking.ctaLabel}
                  </a>
                ) : (
                  <Link href={bookingHref()} className="hover:text-white" data-analytics="booking_click" data-placement="footer">
                    {siteConfig.booking.ctaLabel}
                  </Link>
                )}
              </li>
            </ul>
          </nav>
          <div>
            <h2 className={heading}>Contact</h2>
            <address className="mt-5 grid gap-3 text-[0.9375rem] not-italic">
              <span>{loc.address.join(", ")}</span>
              <a href={loc.phoneHref} className="font-semibold text-white hover:underline" data-analytics="call_click" data-placement="footer">
                <span className="sr-only">Call </span>
                {loc.phone}
              </a>
              <a href={`mailto:${loc.email}`} className="break-words hover:text-white">
                {loc.email}
              </a>
            </address>
            <p className="mt-3 text-[0.9375rem]">{loc.hoursSummary}</p>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {clinic.name}.{siteConfig.demo ? " Demo website, not a real clinic." : ""}{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-white">
              Privacy
            </Link>
          </p>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {siteConfig.demo && (
              <Link href={siteConfig.inquiry.path} className="underline underline-offset-2 hover:text-white">
                {siteConfig.demoBanner.linkLabel}
              </Link>
            )}
            <a href={siteConfig.smatch.url} className="inline-flex items-center gap-1.5 hover:text-white" rel="noopener">
              <span className="size-1.5 rounded-full bg-sage" aria-hidden="true" />
              {siteConfig.smatch.poweredByLabel}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
