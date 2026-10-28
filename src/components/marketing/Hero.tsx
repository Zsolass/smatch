import { AccentTitle } from "@/components/ui/AccentTitle";
import { Arrow, ButtonLink } from "@/components/ui/Button";
import { Picture } from "@/components/ui/Picture";
import { lab } from "@/config/lab";
import { siteConfig } from "@/config/site";

export function Hero() {
  const { hero } = lab;
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(60%_60%_at_80%_10%,var(--color-accent-soft),transparent_70%)] opacity-70"
      />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-8 pb-16 sm:px-6 sm:pt-12 lg:grid-cols-[1.02fr_1fr] lg:gap-14 lg:px-8 lg:pt-16 lg:pb-24">
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white/70 px-3 py-1 text-sm font-medium text-accent">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            {hero.eyebrow}
          </p>
          <h1 id="hero-title" className="mt-5 text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance text-ink sm:text-6xl lg:text-[4.4rem]">
            <AccentTitle text={hero.title} />
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-ink-soft sm:text-xl">{hero.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/submit-case" size="lg">
              Try case submission <Arrow />
            </ButtonLink>
            <ButtonLink href="/#services" size="lg" variant="secondary">
              Explore services
            </ButtonLink>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
            {hero.points.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <svg viewBox="0 0 16 16" className="size-4 text-accent" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {p}
              </li>
            ))}
          </ul>

          <aside
            aria-label="For dental lab owners"
            className="mt-10 flex flex-col gap-4 rounded-2xl border border-line bg-white/80 p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:p-5"
          >
            <p className="text-sm leading-relaxed text-ink-soft">
              <span className="font-semibold text-ink">For lab owners · </span>
              {siteConfig.inquiry.heroNote}
            </p>
            <ButtonLink href="/#inquire" size="md" className="shrink-0 bg-night hover:bg-night-soft">
              {siteConfig.inquiry.ctaLabel}
            </ButtonLink>
          </aside>
        </div>

        <div className="relative animate-fade-up [animation-delay:120ms]">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-night shadow-[var(--shadow-lift)] ring-1 ring-black/5">
            <Picture
              image={hero.image}
              priority
              sizes="(min-width: 1280px) 600px, (min-width: 1024px) 48vw, 100vw"
              className="aspect-[5/4] w-full object-cover sm:aspect-square"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-night/70 to-transparent" aria-hidden="true" />
            <div className="absolute right-4 bottom-4 left-4 flex flex-wrap items-end justify-between gap-3 text-white">
              <div className="rounded-xl bg-white/10 px-3.5 py-2.5 backdrop-blur-md ring-1 ring-white/15">
                <p className="text-[0.7rem] font-medium tracking-wide text-white/60 uppercase">Ceramic · CAD</p>
                <p className="text-sm font-medium">From design mesh to finished arch</p>
              </div>
              <span className="rounded-full bg-black/30 px-2.5 py-1 text-[0.7rem] font-medium text-white/80 ring-1 ring-white/15">Illustrative render</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
