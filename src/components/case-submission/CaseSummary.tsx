"use client";

import { workTypeById } from "@/config/case-submission";
import { formatDate, STEPS, summarizeSelection, validateStep, type CaseDraft } from "@/lib/case-submission/model";
import { formatBytes } from "@/lib/files";
import { StatusDot } from "./ReviewStep";

/** Live summary: a sticky sidebar on desktop, a collapsible panel on mobile. */
export function CaseSummary({ draft, step, variant }: { draft: CaseDraft; step: number; variant: "panel" | "sidebar" }) {
  const ready = [0, 1, 2].filter((s) => Object.keys(validateStep(s, draft)).length === 0).length;
  if (variant === "panel") {
    return (
      <details className="group rounded-[var(--radius-card)] border border-line bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-sm font-semibold text-ink">Case summary</span>
            <span className="block text-xs text-ink-soft">
              {ready} of 3 sections complete · Step {step + 1} of {STEPS.length}
            </span>
          </span>
          <span className="flex items-center gap-1 text-sm font-medium text-accent">
            <span className="group-open:hidden">Show</span>
            <span className="hidden group-open:inline">Hide</span>
            <svg viewBox="0 0 16 16" className="size-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </summary>
        <div className="border-t border-line px-4 py-4">
          <SummaryBody draft={draft} />
        </div>
      </details>
    );
  }
  return (
      <aside aria-label="Case summary" className="rounded-[var(--radius-card)] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink">Case summary</h2>
          <span className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-medium text-ink-soft">Demo</span>
        </div>
        <p className="mt-1 text-xs text-ink-soft">{ready} of 3 sections complete</p>
        <div className="mt-4">
          <SummaryBody draft={draft} />
        </div>
      </aside>
  );
}

function SummaryBody({ draft }: { draft: CaseDraft }) {
  const { practice: p, restoration: r, files, instructions } = draft;
  const type = r.workType ? workTypeById[r.workType] : null;
  const selection = summarizeSelection(r);
  const ok = (s: number) => Object.keys(validateStep(s, draft)).length === 0;
  const total = files.reduce((sum, f) => sum + f.file.size, 0);

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 text-sm">
      <Block title="Practice & case" ok={ok(0)}>
        <Line label="Practice" value={p.practiceName} />
        <Line label="Dentist" value={p.dentistName} />
        <Line label="Case ref." value={p.caseReference} />
        <Line label="Requested" value={p.dueDate ? formatDate(p.dueDate) : ""} />
      </Block>
      <Block title="Restoration" ok={ok(1)}>
        <Line label="Work type" value={type?.label ?? ""} />
        <Line label="Material" value={r.material} />
        {type?.shade !== false && <Line label="Shade" value={r.shade} />}
        {selection && (
          <div className="mt-1.5 rounded-lg bg-paper px-3 py-2">
            <p className="font-medium text-ink">{selection.heading}</p>
            {selection.lines.length > 0 && type?.selection === "bridge" && (
              <ul className="mt-1 grid grid-cols-1 gap-1 text-xs text-ink-soft">
                {selection.lines.map((l) => (
                  <li key={l.label}>
                    <span className="font-medium text-ink">{l.label}</span>
                    <br />
                    {l.detail}
                  </li>
                ))}
              </ul>
            )}
            {selection.lines.length > 0 && type?.selection === "teeth" && <p className="mt-0.5 text-xs text-ink-soft">{type.toothRole} on each tooth</p>}
          </div>
        )}
      </Block>
      <Block title="Files & instructions" ok={ok(2)}>
        <Line label="Files" value={files.length ? `${files.length} · ${formatBytes(total)}` : ""} />
        {files.length > 0 && (
          <ul className="mt-1 grid grid-cols-1 gap-0.5 text-xs text-ink-soft">
            {files.slice(0, 6).map((f) => (
              <li key={f.id} className="truncate">
                {f.category}: {f.file.name}
              </li>
            ))}
            {files.length > 6 && <li>+ {files.length - 6} more</li>}
          </ul>
        )}
        <Line label="Instructions" value={instructions ? `${instructions.slice(0, 60)}${instructions.length > 60 ? "…" : ""}` : ""} />
      </Block>
      <p className="text-xs text-ink-soft">Demo only: this summary stays in your browser.</p>
    </div>
  );
}

function Block({ title, ok, children }: { title: string; ok: boolean; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">
        <StatusDot ok={ok} />
        {title}
      </h3>
      <div className="grid min-w-0 grid-cols-1 gap-0.5 pl-7">{children}</div>
    </section>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between gap-3">
      <span className="shrink-0 text-ink-soft">{label}</span>
      <span className={`min-w-0 truncate text-right ${value ? "font-medium text-ink" : "text-ink-soft/60"}`} title={value || undefined}>
        {value || "—"}
      </span>
    </p>
  );
}
