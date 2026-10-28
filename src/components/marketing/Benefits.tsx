import { SectionHeading } from "@/components/ui/SectionHeading";
import { lab } from "@/config/lab";

const icons = [
  <path key="0" d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4 4v-4h-.5A2.5 2.5 0 0 1 4 13.5v-7Z" />,
  <path key="1" d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />,
  <path key="2" d="M7 3.5h7l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1ZM14 3.5V8h4M9 12h6M9 15.5h6" />,
  <path key="3" d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4M12 8v4l2.5 2.5" />,
];

export function Benefits() {
  return (
    <section aria-labelledby="benefits-title" className="pb-20 sm:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="on-dark relative overflow-hidden rounded-[2rem] bg-night px-6 py-14 text-white sm:px-10 lg:px-14 lg:py-16">
          <div aria-hidden="true" className="absolute -top-24 -right-24 size-96 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative">
            <SectionHeading id="benefits-title" tone="dark" eyebrow="Why dentists work with us" title="Less chasing, *more clarity*" />
            <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {lab.benefits.map((b, i) => (
                <li key={b.title} data-reveal style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}>
                  <span className="grid size-11 place-items-center rounded-xl bg-white/10 text-highlight ring-1 ring-white/10">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {icons[i % icons.length]}
                    </svg>
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{b.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-white/65">{b.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
