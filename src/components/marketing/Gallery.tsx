"use client";

import { useEffect, useState } from "react";
import { CloseButton, Dialog } from "@/components/ui/Dialog";
import { Picture } from "@/components/ui/Picture";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { lab } from "@/config/lab";

export function Gallery() {
  const [index, setIndex] = useState<number | null>(null);
  const cases = lab.cases;
  const open = index !== null;
  const current = index !== null ? cases[index] : null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => (i === null ? i : (i + 1) % cases.length));
      if (e.key === "ArrowLeft") setIndex((i) => (i === null ? i : (i - 1 + cases.length) % cases.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, cases.length]);

  return (
    <section id="work" aria-labelledby="work-title" className="on-dark bg-night py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            id="work-title"
            tone="dark"
            eyebrow="Our work"
            title="Cases from the *bench*"
            description="A selection of typical restorations. Select a case to enlarge it."
          />
          <p className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/70 md:self-auto" data-reveal>
            <span className="size-1.5 rounded-full bg-warm" aria-hidden="true" />
            Sample cases: illustrative renders, no patient data
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          {cases.map((c, i) => (
            <li key={c.id} className={i === 0 ? "lg:col-span-2 lg:row-span-2" : ""} data-reveal style={{ "--reveal-delay": `${(i % 3) * 70}ms` } as React.CSSProperties}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-haspopup="dialog"
                aria-label={`Enlarge sample case: ${c.title}, ${c.material}, teeth ${c.teeth}`}
                className="group relative block h-full w-full overflow-hidden rounded-2xl bg-night-soft text-left ring-1 ring-white/10 transition-shadow hover:ring-white/30"
              >
                <Picture
                  image={c.image}
                  sizes={i === 0 ? "(min-width: 1024px) 800px, 100vw" : "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"}
                  className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-4 pt-12 sm:p-5 sm:pt-16">
                  <span className="mb-2 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[0.68rem] font-medium tracking-wide text-white/85 uppercase backdrop-blur">
                    Sample case
                  </span>
                  <span className={`block font-semibold tracking-tight ${i === 0 ? "text-2xl" : "text-lg"}`}>{c.title}</span>
                  <span className="mt-0.5 block text-sm text-white/70">
                    {c.workType} · {c.material} · {c.teeth}
                  </span>
                </span>
                <span className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-black/35 text-white opacity-0 ring-1 ring-white/20 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true">
                  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5l-4.5 4.5M2.5 13.5L7 9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={open} onClose={() => setIndex(null)} labelledBy="case-dialog-title" className="max-w-5xl bg-night text-white">
        {current && index !== null && (
          <div className="on-dark">
            <div className="relative">
              <Picture image={current.image} sizes="(min-width: 1024px) 1000px, 100vw" className="aspect-[4/3] w-full object-cover" />
              <div className="absolute top-3 right-3">
                <CloseButton onClick={() => setIndex(null)} tone="dark" />
              </div>
            </div>
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="text-xs font-medium tracking-wide text-warm uppercase">Sample case · demo content</p>
                <h2 id="case-dialog-title" className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                  {current.title}
                </h2>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-white/75">
                  <dt className="text-white/50">Work type</dt>
                  <dd>{current.workType}</dd>
                  <dt className="text-white/50">Material</dt>
                  <dd>{current.material}</dd>
                  <dt className="text-white/50">Teeth</dt>
                  <dd>{current.teeth}</dd>
                </dl>
                <p className="mt-2 max-w-xl text-sm text-white/65">{current.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="mr-1 text-sm text-white/60" aria-live="polite">
                  {index + 1} / {cases.length}
                </span>
                <button
                  type="button"
                  onClick={() => setIndex((index - 1 + cases.length) % cases.length)}
                  className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
                  aria-label="Previous case"
                >
                  <svg viewBox="0 0 16 16" className="size-4 rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((index + 1) % cases.length)}
                  className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
                  aria-label="Next case"
                >
                  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </section>
  );
}
