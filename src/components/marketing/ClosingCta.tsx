import { Arrow, ButtonLink } from "@/components/ui/Button";
import { siteConfig } from "@/config/site";

export function ClosingCta() {
  return (
    <section aria-labelledby="closing-title" className="on-dark relative overflow-hidden bg-night py-20 text-white sm:py-24">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(50%_80%_at_85%_0%,rgb(103_214_211/0.18),transparent_70%),radial-gradient(40%_60%_at_0%_100%,rgb(201_138_75/0.14),transparent_70%)]" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="max-w-2xl" data-reveal>
          <p className="text-sm font-semibold tracking-wide text-highlight uppercase">For dental lab owners</p>
          <h2 id="closing-title" className="mt-3 text-[2.2rem] leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">
            Want a website like this for <em className="accent-serif">your lab</em>?
          </h2>
          <p className="mt-5 text-lg text-white/70">
            {siteConfig.smatch.name} builds websites for dental laboratories: your brand, your services and a case submission flow your dentists can use from day one.
          </p>
        </div>
        <div className="flex flex-wrap gap-3" data-reveal>
          <ButtonLink href="/#inquire" variant="light" size="lg">
            {siteConfig.inquiry.ctaLabel} <Arrow />
          </ButtonLink>
          <ButtonLink href="/submit-case" variant="outline-light" size="lg">
            Try case submission
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
