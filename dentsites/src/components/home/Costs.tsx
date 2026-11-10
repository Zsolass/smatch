import { BookingLink } from "@/components/site/BookingLink";
import { CheckBullet } from "@/components/ui/Icon";
import { SampleNotice } from "@/components/ui/SampleTag";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { clinic } from "@/config/clinic";
import { findTreatment } from "@/config/treatments";
import { formatMoney } from "@/lib/format";
import { FeeList } from "./FeeList";

export function ConsultationFeeCard({ treatment, placement }: { treatment?: string; placement: string }) {
  const c = clinic.costs.consultation;
  return (
    <div className="on-dark rounded-[var(--radius-card)] bg-accent p-7 text-white shadow-[var(--shadow-lift)] sm:p-8">
      <p className="text-xs font-semibold tracking-[0.14em] text-white/70 uppercase">{c.label}</p>
      <p className="mt-3 flex items-baseline gap-2">
        <span className="display text-6xl">{formatMoney(c.amount)}</span>
        <span className="text-white/70">{c.unit}</span>
      </p>
      <p className="mt-2 text-white/80">{c.duration}</p>
      <ul className="mt-6 grid gap-3 border-t border-white/15 pt-6 text-[0.9375rem]">
        {c.includes.map((item) => (
          <li key={item} className="flex gap-3">
            <CheckBullet tone="dark" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm text-white/65">{c.note}</p>
      <BookingLink placement={placement} treatment={treatment} variant="pop" className="mt-7 w-full" />
    </div>
  );
}

/** Consultation fee, treatment fees and financing. Fees for treatments the clinic doesn't offer are left out. */
export function Costs() {
  const { costs } = clinic;
  const fees = costs.fees.filter((f) => !f.treatment || findTreatment(f.treatment));
  return (
    <section id="costs" aria-labelledby="costs-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading id="costs-title" eyebrow={costs.eyebrow} title={costs.title} description={costs.description} />
        <div className="mt-12 grid gap-10 lg:grid-cols-[0.8fr_1.5fr] lg:gap-14">
          <div className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start" data-reveal>
            <ConsultationFeeCard placement="costs" />
          </div>
          <div data-reveal>
            <h3 className="display text-3xl text-ink">Treatment fees</h3>
            <div className="mt-6">
              <FeeList fees={fees} linkTreatments />
            </div>
            <SampleNotice className="mt-5">{costs.notice}</SampleNotice>
          </div>
        </div>

        {costs.financing && (
          <div className="mt-16 rounded-[var(--radius-card)] border border-line bg-surface p-7 shadow-[var(--shadow-card)] sm:p-10" data-reveal>
            <h3 className="display text-3xl text-ink">{costs.financing.title}</h3>
            <ul className="mt-8 grid gap-8 md:grid-cols-3">
              {costs.financing.options.map((option) => (
                <li key={option.title} className="border-t-2 border-accent/70 pt-4">
                  <h4 className="font-semibold text-ink">{option.title}</h4>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{option.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
