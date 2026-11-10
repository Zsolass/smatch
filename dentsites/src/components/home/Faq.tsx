import { AccentTitle } from "@/components/ui/AccentTitle";

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg py-5 text-left text-lg font-semibold text-ink [&::-webkit-details-marker]:hidden">
            {item.q}
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-ink-soft transition-transform duration-300 group-open:rotate-45 group-open:border-accent group-open:text-accent" aria-hidden="true">
              <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M8 3v10M3 8h10" strokeLinecap="round" />
              </svg>
            </span>
          </summary>
          <p className="max-w-2xl pb-6 text-ink-soft">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

/** A heading on the left and the questions on the right. Renders nothing without questions. */
export function Faq({ id = "faq", eyebrow = "FAQ", title, items, children }: { id?: string; eyebrow?: string; title: string; items: { q: string; a: string }[]; children?: React.ReactNode }) {
  if (!items.length) return null;
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:gap-16 lg:px-8">
        <div data-reveal>
          <p className="eyebrow mb-4">{eyebrow}</p>
          <h2 id={`${id}-title`} className="display text-[2.25rem] text-balance text-ink sm:text-5xl">
            <AccentTitle text={title} />
          </h2>
          {children && <div className="mt-5 text-ink-soft">{children}</div>}
        </div>
        <div data-reveal>
          <FaqList items={items} />
        </div>
      </div>
    </section>
  );
}
