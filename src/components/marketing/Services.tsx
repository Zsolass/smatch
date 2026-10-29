"use client";

import { useState } from "react";
import { Arrow, ButtonLink } from "@/components/ui/Button";
import { CloseButton, Dialog } from "@/components/ui/Dialog";
import { Picture } from "@/components/ui/Picture";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { lab, type LabService } from "@/config/lab";

export function Services() {
  const [active, setActive] = useState<LabService | null>(null);

  return (
    <section id="services" aria-labelledby="services-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            id="services-title"
            eyebrow="Services"
            title="Restorations for every *indication*"
            description="Fixed, implant and removable work, designed digitally and finished by hand. Open a service to see materials and what to send with your case."
          />
          <ButtonLink href="/submit-case" variant="secondary" className="self-start md:self-auto" data-reveal>
            Send a case <Arrow />
          </ButtonLink>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {lab.services.map((service, i) => (
            <li key={service.id} data-reveal style={{ "--reveal-delay": `${(i % 3) * 80}ms` } as React.CSSProperties}>
              <button
                type="button"
                onClick={() => setActive(service)}
                aria-haspopup="dialog"
                className="group flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line/80 bg-white text-left shadow-[var(--shadow-card)] transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-[var(--shadow-lift)]"
              >
                <span className="block overflow-hidden bg-paper-deep">
                  <Picture
                    image={service.image}
                    sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                </span>
                <span className="flex flex-1 flex-col p-6">
                  <span className="text-xl font-semibold tracking-tight text-ink">{service.title}</span>
                  <span className="mt-2 flex-1 text-[0.9375rem] leading-relaxed text-ink-soft">{service.summary}</span>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                    View details <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={active !== null} onClose={() => setActive(null)} labelledBy="service-dialog-title" className="max-w-4xl">
        {active && <ServiceDetail service={active} onClose={() => setActive(null)} />}
      </Dialog>
    </section>
  );
}

function ServiceDetail({ service, onClose }: { service: LabService; onClose: () => void }) {
  return (
    <div className="grid md:grid-cols-[1fr_1.1fr]">
      <div className="relative bg-paper-deep">
        <Picture image={service.image} sizes="(min-width: 768px) 420px, 100vw" className="aspect-[4/3] h-full w-full object-cover md:aspect-auto" />
        <div className="absolute top-3 right-3 md:hidden">
          <CloseButton onClick={onClose} />
        </div>
      </div>
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-accent uppercase">Service</p>
            <h2 id="service-dialog-title" className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {service.title}
            </h2>
          </div>
          <div className="hidden md:block">
            <CloseButton onClick={onClose} />
          </div>
        </div>
        <p className="mt-4 leading-relaxed text-ink-soft">{service.description}</p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-ink">What we make</h3>
            <ul className="mt-2 grid gap-1.5 text-sm text-ink-soft">
              {service.includes.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">What to send</h3>
            <ul className="mt-2 grid gap-1.5 text-sm text-ink-soft">
              {service.sendInfo.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-warm" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <h3 className="mt-6 text-sm font-semibold text-ink">Materials</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {service.materials.map((m) => (
            <li key={m} className="rounded-full border border-line bg-white px-3 py-1 text-sm text-ink">
              {m}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
          {service.caseActions.map((action, i) => (
            <ButtonLink key={action.workType} href={`/submit-case?type=${action.workType}`} variant={i === 0 ? "primary" : "secondary"}>
              {action.label} <Arrow />
            </ButtonLink>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-soft">Opens the case submission demo with this work type selected.</p>
      </div>
    </div>
  );
}
