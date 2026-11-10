"use client";

import Link from "next/link";
import { useState } from "react";
import { Arrow } from "@/components/ui/Button";
import type { ResultCase } from "@/config/clinic";
import { BeforeAfter } from "./BeforeAfter";

/** One case at a time, chosen from a list; each case links to its treatment page. */
export function CaseGallery({ cases, treatmentLinks = true }: { cases: ResultCase[]; treatmentLinks?: boolean }) {
  const [index, setIndex] = useState(0);
  const current = cases[index] ?? cases[0];
  if (!current) return null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.45fr_1fr] lg:gap-12">
      <div className="min-w-0 lg:order-1">
        {/* Keyed so the divider returns to the middle for each case. */}
        <BeforeAfter key={current.id} before={current.before} after={current.after} label={current.title} sizes="(min-width: 1280px) 720px, (min-width: 1024px) 58vw, 100vw" />
      </div>

      <div className="flex min-w-0 flex-col gap-8 lg:order-2">
        {cases.length > 1 && (
          <ul className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:flex-col lg:overflow-visible" aria-label="Cases">
            {cases.map((c, i) => (
              <li key={c.id} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  aria-pressed={i === index}
                  onClick={() => setIndex(i)}
                  className="group flex w-full items-baseline gap-4 rounded-2xl border border-white/12 px-5 py-3.5 text-left transition-colors hover:border-white/35 aria-pressed:border-sage/70 aria-pressed:bg-white/8"
                >
                  <span className="font-display text-lg text-sage italic" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block font-semibold text-white">{c.title}</span>
                    <span className="mt-0.5 block text-sm text-white/60">{c.treatmentLabel}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div aria-live="polite" className="border-t border-white/12 pt-6">
          <h3 className="display text-3xl text-white">{current.title}</h3>
          <dl className="mt-5 grid gap-4 text-[0.9375rem]">
            <div>
              <dt className="text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">Starting concern</dt>
              <dd className="mt-1 text-white/85">{current.concern}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">Treatment</dt>
              <dd className="mt-1 text-white/85">
                {current.treatmentLabel}. {current.summary}
              </dd>
            </div>
          </dl>
          {treatmentLinks && (
            <Link href={`/treatments/${current.treatment}`} className="mt-6 inline-flex items-center gap-2 font-semibold text-sage underline-offset-4 hover:underline">
              About this treatment <Arrow />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
