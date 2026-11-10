import Link from "next/link";
import { BookingLink, CallLink } from "@/components/site/BookingLink";
import { Arrow } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { clinic } from "@/config/clinic";
import { enabledTreatments } from "@/config/treatments";
import { formatMoney } from "@/lib/format";

const chips = ["bg-pop", "bg-coral", "bg-sage", "bg-accent-soft", "bg-coral", "bg-pop"];

/** "Choose by patient need": one card per treatment the clinic offers. */
export function NeedCards() {
  if (!enabledTreatments.length) return null;
  const { needs } = clinic;
  const { consultation } = clinic.costs;
  return (
    <section id="treatments" aria-labelledby="treatments-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading id="treatments-title" eyebrow={needs.eyebrow} title={needs.title} description={needs.description} />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {enabledTreatments.map((t, i) => (
            <li key={t.id} data-reveal style={{ "--reveal-delay": `${(i % 3) * 70}ms` } as React.CSSProperties}>
              <Link
                href={`/treatments/${t.id}`}
                className="group flex h-full items-start gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:border-accent hover:bg-accent hover:shadow-[var(--shadow-lift)] sm:flex-col sm:gap-0 sm:p-7"
              >
                <span className={`grid size-12 shrink-0 place-items-center rounded-full text-night transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 sm:size-14 ${chips[i % chips.length]}`}>
                  <Icon name={t.need.icon} className="size-6" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col sm:mt-6 sm:w-full">
                  <h3 className="display text-[1.375rem] leading-[1.15] text-ink transition-colors group-hover:text-white sm:text-[1.625rem]">{t.need.title}</h3>
                  <p className="mt-2 flex-1 text-[0.9375rem] leading-relaxed text-ink-soft transition-colors group-hover:text-white/80 sm:mt-3">{t.need.description}</p>
                  <p className="mt-3 inline-flex items-center gap-2 text-[0.9375rem] font-semibold text-accent transition-colors group-hover:border-white/25 group-hover:text-pop sm:mt-6 sm:border-t sm:border-line sm:pt-4">
                    {t.name}
                    <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <div className="on-dark mt-10 grid items-center gap-8 rounded-[var(--radius-card)] bg-night p-7 text-white sm:p-10 lg:grid-cols-[1fr_auto]" data-reveal>
          <div>
            <p className="eyebrow">Not sure which applies to you?</p>
            <p className="display mt-4 max-w-2xl text-3xl text-balance sm:text-4xl">
              Start with a consultation. Your dentist goes through <em>the options</em> with you.
            </p>
            <p className="mt-4 max-w-2xl text-white/70">
              {consultation.label} {formatMoney(consultation.amount)} · {consultation.duration.toLowerCase()}. {consultation.includes.join(". ")}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:flex-col">
            <BookingLink placement="needs" variant="pop" size="lg" arrow />
            <CallLink placement="needs" variant="outline-light" size="lg" />
          </div>
        </div>
      </div>
    </section>
  );
}
