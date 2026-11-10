import type { Metadata } from "next";
import Link from "next/link";
import { ContactSection } from "@/components/home/ContactSection";
import { PageShell } from "@/components/site/PageShell";
import { Arrow } from "@/components/ui/Button";
import { Picture } from "@/components/ui/Picture";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { clinic, mainLocation } from "@/config/clinic";
import { enabledTreatments } from "@/config/treatments";

export const metadata: Metadata = {
  title: `Treatments in ${mainLocation.name}`,
  description: `Treatments at ${clinic.name}, explained in plain language: ${enabledTreatments.map((t) => t.name.toLowerCase()).join(", ")}.`,
  alternates: { canonical: "/treatments" },
};

export default function TreatmentsPage() {
  return (
    <PageShell>
      <section aria-labelledby="treatments-index-title" className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading as="h1" id="treatments-index-title" eyebrow="Treatments" title="Care for *every stage*" description="Each page explains the options, how suitability is assessed, the stages of treatment and the fees. Every treatment starts with a consultation." />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {enabledTreatments.map((t, i) => (
              <li key={t.id} data-reveal style={{ "--reveal-delay": `${(i % 3) * 70}ms` } as React.CSSProperties}>
                <Link
                  href={`/treatments/${t.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[var(--shadow-lift)]"
                >
                  <span className="block overflow-hidden bg-paper-deep">
                    <Picture image={t.image} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" priority={i < 3} className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                  </span>
                  <span className="flex flex-1 flex-col p-6">
                    <span className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">{t.need.title}</span>
                    <span className="display mt-3 text-[1.625rem] leading-tight text-ink">{t.name}</span>
                    <span className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-ink-soft">{t.need.description}</span>
                    <span className="mt-5 inline-flex items-center gap-2 text-[0.9375rem] font-semibold text-accent">
                      Read more <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <ContactSection placement="treatments-index" />
    </PageShell>
  );
}
