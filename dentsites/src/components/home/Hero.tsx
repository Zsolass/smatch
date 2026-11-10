import Link from "next/link";
import { BookingLink } from "@/components/site/BookingLink";
import { InquireLink } from "@/components/site/InquireLink";
import { OwnerCallout } from "@/components/site/OwnerCallout";
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
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 right-[-12rem] -z-10 size-[44rem] rounded-full bg-pop/45 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute top-1/2 -left-40 -z-10 size-[26rem] rounded-full bg-coral/20 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-10 pb-16 sm:px-6 sm:pt-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:px-8 lg:pt-16 lg:pb-24">
        <div className="animate-fade-up">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1 id="hero-title" className="display mt-6 text-[2.625rem] text-balance text-ink sm:text-6xl lg:text-[4.25rem]">
            <AccentTitle text={hero.title} />
          </h1>
          <p className="mt-6 max-w-xl text-lg text-pretty text-ink-soft sm:text-xl sm:leading-relaxed">{hero.description}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <BookingLink placement="hero" size="lg" arrow />
            <InquireLink size="lg" />
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
          <div className="mt-9">
            <OwnerCallout kind="card" />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md animate-fade-up [animation-delay:140ms] lg:max-w-none">
          <div aria-hidden="true" className="absolute -right-4 -bottom-5 h-[72%] w-[72%] rounded-[1.5rem] bg-pop sm:-right-6 sm:-bottom-7" />
          {/* A slowly turning stamp; decorative. */}
          <div aria-hidden="true" className="absolute -top-6 -left-6 z-10 grid size-28 place-items-center rounded-full bg-coral text-night shadow-[var(--shadow-lift)] sm:-left-10 sm:size-32">
            <svg viewBox="0 0 120 120" className="absolute inset-0 animate-spin-slow">
              <defs>
                <path id="stamp-circle" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" />
              </defs>
              <text className="fill-current text-[11.5px] font-semibold tracking-[0.2em] uppercase">
                <textPath href="#stamp-circle">New patients welcome · New patients welcome ·</textPath>
              </text>
            </svg>
            <Icon name="tooth" className="size-9" />
          </div>
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
            className="group absolute bottom-8 -left-2 flex max-w-[15.5rem] animate-float items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 pr-5 shadow-[var(--shadow-lift)] transition-transform duration-300 hover:-translate-y-0.5 sm:-left-8"
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
