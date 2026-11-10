import { Picture } from "@/components/ui/Picture";
import { SampleTag } from "@/components/ui/SampleTag";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { clinic } from "@/config/clinic";

export function Technology() {
  const { technology: tech } = clinic;
  const lab = tech.inHouseLab.enabled ? tech.inHouseLab : null;
  if (!tech.items.length && !lab) return null;
  return (
    <section id="clinic" aria-labelledby="clinic-title" className="bg-paper-deep/70 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <figure className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]" data-reveal>
            <div className="overflow-hidden rounded-[var(--radius-card)] bg-night shadow-[var(--shadow-lift)]">
              <Picture image={tech.image} sizes="(min-width: 1024px) 600px, 100vw" className="aspect-[4/3] w-full object-cover" />
            </div>
            <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-soft">
              {tech.imageCaption}
              <SampleTag>Illustration</SampleTag>
            </figcaption>
          </figure>
          <div>
            <SectionHeading id="clinic-title" eyebrow={tech.eyebrow} title={tech.title} description={tech.description} />
            <ul className="mt-10 grid gap-8">
              {tech.items.map((item, i) => (
                <li key={item.title} className="flex gap-5" data-reveal style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}>
                  <span className="display mt-0.5 text-2xl text-accent/50 italic" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="display text-2xl text-ink">{item.title}</h3>
                    <p className="mt-2 text-ink-soft">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {lab && (
          <div className="mt-16 grid items-center gap-8 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)] md:grid-cols-[1fr_1.4fr]" data-reveal>
            <Picture image={lab.image} sizes="(min-width: 768px) 480px, 100vw" className="aspect-[4/3] h-full w-full object-cover" />
            <div className="p-7 pt-0 md:p-10 md:pl-2">
              <p className="eyebrow">On site</p>
              <h3 className="display mt-4 text-3xl text-ink">{lab.title}</h3>
              <p className="mt-3 max-w-xl text-ink-soft">{lab.description}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
