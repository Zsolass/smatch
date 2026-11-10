import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InquiryForm } from "@/components/inquiry/InquiryForm";
import { PageShell } from "@/components/site/PageShell";
import { Arrow } from "@/components/ui/Button";
import { CheckBullet } from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";
import { enabledTreatments } from "@/config/treatments";

export const metadata: Metadata = {
  title: "A website like this for your clinic",
  description: `${siteConfig.smatch.name} builds websites for dentists and dental clinics. Request a personalised quote for a site like this demo.`,
  alternates: { canonical: siteConfig.inquiry.path },
};

const included = [
  "Your brand, photography, team and treatments",
  "Treatment pages that explain options, stages and fees",
  "A before-and-after gallery patients can compare",
  "Consultation requests to your inbox, or a link to your booking system",
  "Designed for phones first, fast and accessible",
];

// The clinic-owner journey: kept apart from the patient pages, and the only
// place where the website service itself is discussed.
export default function GetThisWebsitePage() {
  if (!siteConfig.demo) notFound();
  const { inquiry, smatch } = siteConfig;
  const sample = enabledTreatments[0];
  const tour = [
    { label: "The homepage, as a patient sees it", href: "/" },
    ...(sample ? [{ label: `A treatment page: ${sample.name}`, href: `/treatments/${sample.id}` }] : []),
    { label: "The consultation request (demo)", href: siteConfig.booking.path },
  ];
  return (
    <PageShell actionBar={false}>
      <section id="inquire" aria-labelledby="inquire-title" className="relative overflow-hidden py-12 sm:py-16">
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 right-[-12rem] -z-10 size-[40rem] rounded-full bg-accent-soft/70 blur-3xl" />
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.3fr] lg:gap-16 lg:px-8">
          <div className="lg:sticky lg:top-[calc(var(--header-height)+2rem)] lg:self-start">
            <p className="inline-flex items-center gap-2 rounded-full bg-night px-3.5 py-1.5 text-xs font-semibold tracking-[0.12em] text-white uppercase">
              <span className="size-1.5 rounded-full bg-sage" aria-hidden="true" />
              For clinic owners · from {smatch.name}
            </p>
            <h1 id="inquire-title" className="display mt-6 text-[2.5rem] text-balance text-ink sm:text-[3.5rem]">
              A website like this, <em>for your clinic</em>
            </h1>
            <p className="mt-5 text-lg text-pretty text-ink-soft">
              {smatch.name} builds websites for dentists and dental clinics. The clinic you have been browsing is fictional; yours carries your name, your work and your
              contact details. {inquiry.subheading}
            </p>
            <ul className="mt-8 grid gap-3.5 text-ink">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckBullet />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-9 border-t border-line pt-6">
              <h2 className="text-xs font-semibold tracking-[0.14em] text-ink-soft uppercase">Take the patient’s route first</h2>
              <ul className="mt-4 grid gap-2.5">
                {tour.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="inline-flex items-center gap-2 font-semibold text-accent underline-offset-4 hover:underline">
                      {item.label} <Arrow />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-8 text-sm text-ink-soft">The clinic on this site is a demo. This form is real: it goes to the {smatch.name} team.</p>
          </div>
          <div>
            <h2 className="display mb-5 text-3xl text-ink">{inquiry.ctaLabel}</h2>
            <InquiryForm />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
