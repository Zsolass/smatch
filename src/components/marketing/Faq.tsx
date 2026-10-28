import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { lab } from "@/config/lab";

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:px-8">
        <div>
          <SectionHeading id="faq-title" eyebrow="FAQ" title="Sending a case, *answered*" />
          <p className="mt-5 text-ink-soft" data-reveal>
            Can&apos;t find what you need?{" "}
            <Link href="/#contact" className="font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent">
              Contact the lab
            </Link>
            .
          </p>
        </div>
        <div className="divide-y divide-line border-y border-line" data-reveal>
          {lab.faq.map((item) => (
            <details key={item.q} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg py-4 text-left text-lg font-medium text-ink [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-ink-soft transition-transform duration-300 group-open:rotate-45 group-open:border-accent group-open:text-accent" aria-hidden="true">
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="max-w-2xl pb-5 leading-relaxed text-ink-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
