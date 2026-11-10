import type { Metadata } from "next";
import { Suspense } from "react";
import { BookForm } from "@/components/consultation/BookForm";
import { LocationDetails } from "@/components/consultation/LocationDetails";
import { PageShell } from "@/components/site/PageShell";
import { CheckBullet } from "@/components/ui/Icon";
import { SampleNotice } from "@/components/ui/SampleTag";
import { clinic } from "@/config/clinic";
import { siteConfig } from "@/config/site";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: siteConfig.booking.ctaLabel,
  description: `Request a consultation at ${clinic.name}: a short form, and the team contacts you to arrange a time.`,
  alternates: { canonical: siteConfig.booking.path },
};

export default function BookPage() {
  const c = clinic.costs.consultation;
  return (
    // The form is the page, so the mobile call/book bar is not needed here.
    <PageShell actionBar={false}>
      <section aria-labelledby="book-title" className="relative overflow-hidden py-12 sm:py-16">
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 right-[-12rem] -z-10 size-[40rem] rounded-full bg-accent-soft/70 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.25fr_0.85fr] lg:gap-16 lg:px-8">
          <div>
            <p className="eyebrow">Consultation</p>
            <h1 id="book-title" className="display mt-5 text-[2.625rem] text-balance text-ink sm:text-6xl">
              Book a <em>consultation</em>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">Tell us how to reach you and, if you like, what you would like help with. We contact you to agree a time.</p>
            <div className="mt-9">
              <Suspense fallback={<div className="h-[36rem] animate-pulse rounded-[var(--radius-card)] bg-paper-deep" />}>
                <BookForm />
              </Suspense>
            </div>
          </div>

          <aside aria-label="About your consultation" className="grid content-start gap-8 lg:pt-28">
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
              <h2 className="display text-2xl text-ink">What your consultation includes</h2>
              <p className="mt-3 text-ink-soft">
                {c.label} {formatMoney(c.amount)} · {c.duration.toLowerCase()}.
              </p>
              <ul className="mt-5 grid gap-3 text-[0.9375rem] text-ink">
                {c.includes.map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckBullet />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-line pt-5 text-sm text-ink-soft">There is no obligation to go ahead with treatment. {c.note}</p>
            </div>
            <div>
              <h2 className="display mb-5 text-2xl text-ink">Prefer to talk?</h2>
              <LocationDetails />
              <SampleNotice className="mt-6">{clinic.sampleNotice}</SampleNotice>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
