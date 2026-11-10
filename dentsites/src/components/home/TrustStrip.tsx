import Link from "next/link";
import { AccentTitle } from "@/components/ui/AccentTitle";
import { Arrow } from "@/components/ui/Button";
import { SampleTag } from "@/components/ui/SampleTag";
import { clinic } from "@/config/clinic";

const initials = (name: string) =>
  name
    .replace(/^Dr\.\s*/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

/**
 * Early trust signals, right after the opening screen: how the clinic works,
 * who the patient will see, and a review score when a genuine one exists.
 * Each part appears only when the clinic has supplied it.
 */
export function TrustStrip() {
  const { eyebrow, statement, items, rating, leadClinicianId } = clinic.trust;
  const lead = clinic.team.members.find((m) => m.id === leadClinicianId);
  if (!statement && !items.length && !rating && !lead) return null;
  return (
    <section aria-labelledby="approach-title" className="border-y border-line/80 bg-surface/70">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.35fr_1fr] lg:gap-16 lg:px-8 lg:py-20">
        <div>
          <p className="eyebrow" data-reveal>
            {eyebrow}
          </p>
          <h2 id="approach-title" className="display mt-5 max-w-2xl text-[2.25rem] text-balance text-ink sm:text-5xl" data-reveal>
            <AccentTitle text={statement} />
          </h2>
          <ul className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {items.map((item, i) => (
              <li key={item.title} className="border-t border-ink/20 pt-5" data-reveal style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}>
                <p className="font-display text-lg text-accent/60 italic" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>

        {(lead || rating) && (
          <aside aria-label="Your dentist and patient reviews" className="self-start rounded-[var(--radius-card)] border border-line bg-paper p-6 shadow-[var(--shadow-card)] sm:p-8" data-reveal>
            {lead && (
              <div>
                <div className="flex items-center gap-5">
                  <div className="arch relative grid h-28 w-24 shrink-0 place-items-center overflow-hidden bg-gradient-to-b from-accent-soft to-sage/45">
                    {lead.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- portraits come from config
                      <img src={lead.photo} alt={`Portrait of ${lead.name}`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="font-display text-3xl text-accent/55" aria-hidden="true">
                        {initials(lead.name)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">Your dentist</p>
                    <p className="display mt-2 text-2xl text-ink">
                      {lead.name}
                      {lead.credentials && <span className="font-sans text-base font-medium tracking-normal text-ink-soft">, {lead.credentials}</span>}
                    </p>
                    <p className="mt-1 text-[0.9375rem] text-ink-soft">{lead.focus}</p>
                  </div>
                </div>
                {lead.qualifications.length > 0 && (
                  <ul className="mt-5 grid gap-1.5 text-sm text-ink-soft">
                    {lead.qualifications.map((q) => (
                      <li key={q} className="flex gap-2">
                        <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                        {q}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <Link href="/#team" className="inline-flex items-center gap-2 text-[0.9375rem] font-semibold text-accent underline-offset-4 hover:underline">
                    Meet the team <Arrow />
                  </Link>
                  <SampleTag>Sample profile</SampleTag>
                </div>
              </div>
            )}
            {rating && (
              <div className={`flex items-center gap-5 ${lead ? "mt-6 border-t border-line pt-6" : ""}`}>
                <p className="display text-5xl text-accent" aria-hidden="true">
                  {rating.value}
                </p>
                <div>
                  <p className="flex gap-0.5 text-warm" aria-hidden="true">
                    {Array.from({ length: 5 }, (_, i) => (
                      <svg key={i} viewBox="0 0 24 24" className="size-4" fill="currentColor">
                        <path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8L12 3.8Z" />
                      </svg>
                    ))}
                  </p>
                  <p className="sr-only">
                    Rated {rating.value} out of {rating.outOf}
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                    <SampleTag>{rating.count}</SampleTag>
                  </p>
                  <p className="mt-1.5 text-xs leading-snug text-ink-soft">{rating.source}</p>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </section>
  );
}
