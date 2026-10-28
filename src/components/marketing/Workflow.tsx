import { Arrow, ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { lab } from "@/config/lab";

const icons = [
  // scan & send
  <path key="0" d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 12h8M12 8v8" />,
  // review
  <path key="1" d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4 4v-4h-.5A2.5 2.5 0 0 1 4 13.5v-7ZM8.5 10h7" />,
  // design & manufacture
  <path key="2" d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 0v18M4 7.5l8 4.5 8-4.5" />,
  // delivery
  <path key="3" d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
];

export function Workflow() {
  return (
    <section id="workflow" aria-labelledby="workflow-title" className="bg-paper-deep/60 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="workflow-title"
          eyebrow="Digital workflow"
          title="From scan to delivery, *without the paperwork*"
          description="Send everything online in one go. We review, design, manufacture and deliver, and you always know where your case stands."
        />
        <div className="relative mt-14">
        <div aria-hidden="true" className="absolute top-12 right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-accent/0 via-accent/40 to-accent/0 lg:block" />
        <ol className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {lab.workflow.map((step, i) => (
            <li
              key={step.title}
              data-reveal
              style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
              className="relative rounded-[var(--radius-card)] border border-line/80 bg-white p-6 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
                  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {icons[i % icons.length]}
                  </svg>
                </span>
                <span className="font-serif text-4xl text-ink/15 italic" aria-hidden="true">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-semibold tracking-tight">
                <span className="sr-only">Step {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{step.description}</p>
            </li>
          ))}
        </ol>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-4" data-reveal>
          <ButtonLink href="/submit-case">
            Try the first step now <Arrow />
          </ButtonLink>
          <p className="text-sm text-ink-soft">The case form is a working demo; nothing is sent to a lab.</p>
        </div>
      </div>
    </section>
  );
}
