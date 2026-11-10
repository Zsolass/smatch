import { BookingLink } from "@/components/site/BookingLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { clinic } from "@/config/clinic";

export function FirstVisit() {
  const { firstVisit } = clinic;
  if (!firstVisit.steps.length) return null;
  return (
    <section id="first-visit" aria-labelledby="first-visit-title" className="bg-paper-deep/70 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading id="first-visit-title" eyebrow={firstVisit.eyebrow} title={firstVisit.title} />
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {firstVisit.steps.map((step, i) => (
            <li key={step.title} className="relative rounded-[var(--radius-card)] border border-line bg-surface p-7 shadow-[var(--shadow-card)] transition-transform duration-300 hover:-translate-y-1" data-reveal style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}>
              <p className={`grid size-14 place-items-center rounded-full font-display text-3xl text-night italic ${["bg-pop", "bg-coral", "bg-sage"][i % 3]}`} aria-hidden="true">
                {i + 1}
              </p>
              <h3 className="display mt-6 text-2xl text-ink">
                <span className="sr-only">Step {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-3 text-ink-soft">{step.description}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex flex-col gap-5 sm:flex-row sm:items-center" data-reveal>
          <BookingLink placement="first-visit" arrow />
          <p className="max-w-xl text-[0.9375rem] text-ink-soft">{firstVisit.note}</p>
        </div>
      </div>
    </section>
  );
}
