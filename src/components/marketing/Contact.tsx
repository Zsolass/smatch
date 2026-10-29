import { Arrow, ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { lab } from "@/config/lab";

export function Contact() {
  const c = lab.contact;
  const items = [
    { label: "Email", value: c.email, href: `mailto:${c.email}` },
    { label: "Phone", value: c.phone, href: c.phoneHref },
    { label: "Address", value: c.address.join(", ") },
    { label: "Opening hours", value: c.hours },
  ];
  return (
    <section id="contact" aria-labelledby="contact-title" className="pb-20 sm:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 rounded-[2rem] border border-line bg-white p-6 shadow-[var(--shadow-card)] sm:p-10 lg:grid-cols-[1fr_1.3fr] lg:p-14">
          <div>
            <SectionHeading id="contact-title" eyebrow="Contact" title="Talk to the *lab*" description="Questions about a case, materials or pick-ups? Get in touch, or send your next case online." />
            <div className="mt-8 flex flex-wrap gap-3" data-reveal>
              <ButtonLink href="/submit-case">
                Send a case <Arrow />
              </ButtonLink>
            </div>
          </div>
          <div data-reveal>
            <dl className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
              {items.map((item) => (
                <div key={item.label} className="bg-paper p-5">
                  <dt className="text-sm text-ink-soft">{item.label}</dt>
                  <dd className="mt-1 font-medium break-words text-ink">
                    {item.href ? (
                      <a href={item.href} className="hover:text-accent">
                        {item.value}
                      </a>
                    ) : (
                      item.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 flex items-start gap-2 text-sm text-ink-soft">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warm" aria-hidden="true" />
              {lab.sampleNotice}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
