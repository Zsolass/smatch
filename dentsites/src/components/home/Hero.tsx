import Link from "next/link";
import { BookingLink } from "@/components/site/BookingLink";
import { AccentTitle } from "@/components/ui/AccentTitle";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Picture } from "@/components/ui/Picture";
import { clinic } from "@/config/clinic";
import { siteConfig } from "@/config/site";
import { formatMoney } from "@/lib/format";

export function Hero() {
  const { hero, costs } = clinic;
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 right-[-12rem] -z-10 size-[44rem] rounded-full bg-accent-soft/70 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-10 pb-16 sm:px-6 sm:pt-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:px-8 lg:pt-16 lg:pb-24">
        <div className="animate-fade-up">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1 id="hero-title" className="display mt-6 text-[2.625rem] text-balance text-ink sm:text-6xl lg:text-[4.25rem]">
            <AccentTitle text={hero.title} />
          </h1>
          <p className="mt-6 max-w-xl text-lg text-pretty text-ink-soft sm:text-xl sm:leading-relaxed">{hero.description}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <BookingLink placement="hero" size="lg" arrow />
            <ButtonLink href={hero.secondaryCta.href} size="lg" variant="secondary">
              {hero.secondaryCta.label}
            </ButtonLink>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-7 gap-y-2.5 text-[0.9375rem] text-ink-soft">
            {hero.points.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <Icon name="check" className="size-4 text-accent" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md animate-fade-up [animation-delay:140ms] lg:max-w-none">
          <div aria-hidden="true" className="absolute -right-4 -bottom-5 h-[72%] w-[72%] rounded-[1.5rem] border border-accent/25 sm:-right-6 sm:-bottom-7" />
          <figure className="arch relative overflow-hidden bg-night shadow-[var(--shadow-lift)]">
            <Picture image={hero.image} priority sizes="(min-width: 1280px) 560px, (min-width: 1024px) 44vw, (min-width: 640px) 448px, 92vw" className="aspect-[4/5] w-full object-cover" />
            {siteConfig.demo && (
              <figcaption className="absolute right-4 bottom-4 rounded-full bg-black/35 px-3 py-1.5 text-xs font-medium text-white/85 ring-1 ring-white/15 backdrop-blur-sm">
                {hero.imageCaption}
              </figcaption>
            )}
          </figure>
          <Link
            href="/#first-visit"
            className="group absolute bottom-8 -left-2 flex max-w-[15.5rem] items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 pr-5 shadow-[var(--shadow-lift)] transition-transform duration-300 hover:-translate-y-0.5 sm:-left-8"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
              <Icon name="calendar" />
            </span>
            <span className="text-[0.9375rem] leading-snug">
              <span className="block font-semibold text-ink">Consultation {formatMoney(costs.consultation.amount)}</span>
              <span className="block text-sm text-ink-soft group-hover:underline">See what a first visit involves</span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
