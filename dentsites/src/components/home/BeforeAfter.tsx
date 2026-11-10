"use client";

import { useId, useState } from "react";
import { Picture } from "@/components/ui/Picture";
import type { ClinicImage } from "@/config/clinic";

interface Props {
  before: ClinicImage;
  after: ClinicImage;
  /** Names the case for screen readers, e.g. "A missing premolar". */
  label: string;
  sizes: string;
}

const VIEWS = [
  { label: "Before", value: 100 },
  { label: "Compare", value: 50 },
  { label: "After", value: 0 },
] as const;

/**
 * Before/after comparison. The divider follows the pointer, touch or the arrow
 * keys (it is a native range input), and the three buttons give the same views
 * without dragging.
 */
export function BeforeAfter({ before, after, label, sizes }: Props) {
  // Percentage of the picture's width that shows the "before" image.
  const [pos, setPos] = useState(50);
  const [smooth, setSmooth] = useState(false);
  const id = useId();
  const ease = smooth ? "duration-500 ease-out" : "duration-0";

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-night-soft select-none">
        <Picture image={after} sizes={sizes} className="absolute inset-0 h-full w-full object-cover" />
        <div className={`absolute inset-0 transition-[clip-path] ${ease}`} style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <Picture image={before} sizes={sizes} className="h-full w-full object-cover" />
        </div>
        <span className={`absolute top-3 left-3 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase backdrop-blur-sm transition-opacity ${pos < 14 ? "opacity-0" : ""}`} aria-hidden="true">
          Before
        </span>
        <span className={`absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold tracking-wide text-night uppercase transition-opacity ${pos > 86 ? "opacity-0" : ""}`} aria-hidden="true">
          After
        </span>
        <div className={`pointer-events-none absolute inset-y-0 -ml-px w-0.5 bg-white transition-[left] ${ease}`} style={{ left: `${pos}%` }} aria-hidden="true">
          <span className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-night shadow-lg">
            <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.5 6 4 10l3.5 4m5-8 3.5 4-3.5 4" />
            </svg>
          </span>
        </div>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          step={1}
          value={pos}
          onChange={(e) => {
            setSmooth(false);
            setPos(Number(e.target.value));
          }}
          aria-label={`Compare before and after: ${label}`}
          aria-valuetext={`${pos}% before, ${100 - pos}% after`}
          className="compare-range peer absolute inset-0 h-full w-full"
        />
        <span className="pointer-events-none absolute inset-0 rounded-[var(--radius-card)] ring-inset peer-focus-visible:ring-4 peer-focus-visible:ring-sage" aria-hidden="true" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label={`Views of ${label}`}>
        {VIEWS.map((view) => (
          <button
            key={view.label}
            type="button"
            aria-pressed={pos === view.value}
            onClick={() => {
              setSmooth(true);
              setPos(view.value);
            }}
            className="h-11 rounded-full border border-current/25 px-5 text-[0.9375rem] font-semibold transition-colors hover:border-current/60 aria-pressed:border-transparent aria-pressed:bg-accent aria-pressed:text-white on-dark:aria-pressed:bg-paper on-dark:aria-pressed:text-night"
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
}
