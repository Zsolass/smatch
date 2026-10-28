import { Picture } from "@/components/ui/Picture";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { lab } from "@/config/lab";

export function LabTechnology() {
  const { about } = lab;
  return (
    <section id="about" aria-labelledby="about-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1" data-reveal>
            <figure className="overflow-hidden rounded-[1.75rem] bg-night shadow-[var(--shadow-lift)]">
              <Picture image={about.image} sizes="(min-width: 1024px) 600px, 100vw" className="aspect-[4/3] w-full object-cover" />
              <figcaption className="on-dark flex items-center justify-between gap-3 px-5 py-3.5 text-sm text-white/70">
                <span>CAD design and the finished crown, side by side</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.7rem] text-white/70">Illustrative</span>
              </figcaption>
            </figure>
          </div>
          <div className="order-1 lg:order-2">
            <SectionHeading id="about-title" eyebrow={about.eyebrow} title={about.title} />
            <div className="mt-5 grid gap-4 text-lg leading-relaxed text-ink-soft" data-reveal>
              {about.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <ul className="mt-8 grid gap-3" data-reveal>
              {about.commitments.map((c) => (
                <li key={c} className="flex items-center gap-3 font-medium text-ink">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-white">
                    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-20">
          <h3 className="text-sm font-semibold tracking-wide text-accent uppercase" data-reveal>
            How a case moves through the lab
          </h3>
          <ol className="mt-5 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {about.process.map((step, i) => (
              <li key={step.title} className="bg-white p-6" data-reveal style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}>
                <p className="font-serif text-2xl text-accent italic">{String(i + 1).padStart(2, "0")}</p>
                <h4 className="mt-3 font-semibold">{step.title}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div data-reveal>
            <h3 className="text-xl font-semibold tracking-tight">Equipment</h3>
            <p className="mt-1 text-sm text-ink-soft">Sample list, configured for each lab.</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {about.equipment.map((item) => (
                <li key={item} className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div data-reveal>
            <h3 className="text-xl font-semibold tracking-tight">The team</h3>
            <p className="mt-1 text-sm text-ink-soft">Your team photos go here.</p>
            <ul className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
              {about.team.map((member, i) => (
                <li key={i}>
                  <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-2xl border border-dashed border-ink/20 bg-[repeating-linear-gradient(135deg,transparent_0_10px,rgb(0_0_0/0.025)_10px_20px)]">
                    {member.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- team photos come from config
                      <img src={member.photo} alt={`${member.name}, ${member.role}`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="flex flex-col items-center gap-2 text-ink/35">
                        <svg viewBox="0 0 24 24" className="size-9" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                          <circle cx="12" cy="8.5" r="3.5" />
                          <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" strokeLinecap="round" />
                        </svg>
                        <span className="text-xs font-medium">Team photo</span>
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium">{member.role}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
