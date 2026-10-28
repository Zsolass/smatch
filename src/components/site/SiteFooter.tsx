import Link from "next/link";
import { lab } from "@/config/lab";
import { siteConfig } from "@/config/site";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="on-dark bg-night text-white/70">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo tone="dark" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">{lab.hero.description.split(".")[0]}.</p>
          </div>
          <nav aria-label="Footer">
            <h2 className="text-sm font-semibold text-white">Explore</h2>
            <ul className="mt-4 grid gap-2.5 text-sm">
              {lab.nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <h2 className="text-sm font-semibold text-white">For dentists</h2>
            <ul className="mt-4 grid gap-2.5 text-sm">
              <li>
                <Link href="/submit-case" className="hover:text-white">
                  Send a case
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
            <h2 className="mt-8 text-sm font-semibold text-white">For lab owners</h2>
            <ul className="mt-4 grid gap-2.5 text-sm">
              <li>
                <Link href="/#inquire" className="hover:text-white">
                  {siteConfig.inquiry.ctaLabel} about a website
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Contact</h2>
            <address className="mt-4 grid gap-1.5 text-sm not-italic">
              <span>{lab.contact.address.join(", ")}</span>
              <a href={lab.contact.phoneHref} className="hover:text-white">
                {lab.contact.phone}
              </a>
              <a href={`mailto:${lab.contact.email}`} className="hover:text-white">
                {lab.contact.email}
              </a>
            </address>
            <p className="mt-3 text-xs text-white/45">Sample details of a fictional lab.</p>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {lab.name}. Demo website, not a real laboratory.{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-white">
              Privacy
            </Link>
          </p>
          <a href={siteConfig.smatch.url} className="inline-flex items-center gap-1.5 hover:text-white" rel="noopener">
            <span className="size-1.5 rounded-full bg-highlight" aria-hidden="true" />
            {siteConfig.smatch.poweredByLabel}
          </a>
        </div>
      </div>
    </footer>
  );
}
