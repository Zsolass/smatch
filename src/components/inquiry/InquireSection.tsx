import { siteConfig } from "@/config/site";
import { InquiryForm } from "./InquiryForm";

const offer = [
  "Your brand, services, cases and photos",
  "A case submission flow tailored to your lab",
  "Designed for desktop and mobile",
];

export function InquireSection() {
  return (
    <section id="inquire" aria-labelledby="inquire-title" className="relative scroll-mt-[calc(var(--header-height)+1rem)] bg-paper-deep/70 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.4fr] lg:gap-16 lg:px-8">
        <div className="lg:sticky lg:top-[calc(var(--header-height)+2rem)] lg:self-start">
          <p className="inline-flex items-center gap-2 rounded-full bg-night px-3 py-1 text-xs font-medium tracking-wide text-white uppercase">
            <span className="size-1.5 rounded-full bg-highlight" aria-hidden="true" />
            From {siteConfig.smatch.name}
          </p>
          <h2 id="inquire-title" className="mt-4 text-[2.4rem] leading-[1.05] font-semibold tracking-tight sm:text-5xl">
            {siteConfig.inquiry.heading}
          </h2>
          <p className="mt-4 text-lg text-pretty text-ink-soft">{siteConfig.inquiry.subheading}</p>
          <ul className="mt-8 grid gap-3">
            {offer.map((item) => (
              <li key={item} className="flex items-start gap-3 text-ink">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent text-white">
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-ink-soft">
            This page is a demo of a lab website. This form is real: it goes to the {siteConfig.smatch.name} team.
          </p>
        </div>
        <InquiryForm />
      </div>
    </section>
  );
}
