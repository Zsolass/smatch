"use client";

import { workTypeById } from "@/config/case-submission";
import { formatDate, summarizeSelection, validateStep, type CaseDraft } from "@/lib/case-submission/model";
import { formatBytes } from "@/lib/files";

interface Props {
  draft: CaseDraft;
  onEdit: (step: number) => void;
}

export function ReviewStep({ draft, onEdit }: Props) {
  const { practice: p, restoration: r, files, instructions } = draft;
  const type = r.workType ? workTypeById[r.workType] : null;
  const selection = summarizeSelection(r);

  return (
    <div className="grid grid-cols-1 gap-4">
      <ReviewSection title="Practice & case details" step={0} draft={draft} onEdit={onEdit}>
        <Row label="Practice">{p.practiceName}</Row>
        <Row label="Dentist">{p.dentistName}</Row>
        <Row label="Email">{p.email}</Row>
        <Row label="Phone">{p.phone || "—"}</Row>
        <Row label="Case reference">{p.caseReference}</Row>
        <Row label="Requested date">
          {p.dueDate ? (
            <>
              {formatDate(p.dueDate)} <span className="text-ink-soft">(requested, to be confirmed by the lab)</span>
            </>
          ) : (
            "—"
          )}
        </Row>
      </ReviewSection>

      <ReviewSection title="Restoration & teeth" step={1} draft={draft} onEdit={onEdit}>
        <Row label="Work type">{type?.label ?? "—"}</Row>
        <Row label="Material">{r.material || "—"}</Row>
        {type?.shade && <Row label="Shade">{r.shade || "Not specified"}</Row>}
        <Row label={type?.selection === "arch" ? "Arch" : type?.selection === "bridge" ? "Bridges" : "Teeth"}>
          {selection && selection.lines.length > 0 ? (
            <ul className="grid gap-1">
              {selection.lines.map((l) => (
                <li key={l.label}>
                  <span className="font-medium">{l.label}</span>
                  {type?.selection !== "arch" && <span className="text-ink-soft"> — {l.detail}</span>}
                </li>
              ))}
            </ul>
          ) : (
            "—"
          )}
        </Row>
        {r.notes && <Row label="Notes">{r.notes}</Row>}
      </ReviewSection>

      <ReviewSection title="Files & instructions" step={2} draft={draft} onEdit={onEdit}>
        <Row label="Files">
          {files.length ? (
            <ul className="grid gap-1">
              {files.map((f) => (
                <li key={f.id} className="break-all">
                  <span className="font-medium">{f.file.name}</span>{" "}
                  <span className="text-ink-soft">
                    · {f.category} · {formatBytes(f.file.size)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            "—"
          )}
        </Row>
        <Row label="Instructions">{instructions ? <span className="whitespace-pre-wrap">{instructions}</span> : "None"}</Row>
      </ReviewSection>
    </div>
  );
}

function ReviewSection({ title, step, draft, onEdit, children }: { title: string; step: number; draft: CaseDraft; onEdit: (s: number) => void; children: React.ReactNode }) {
  const ok = Object.keys(validateStep(step, draft)).length === 0;
  return (
    <section aria-labelledby={`review-${step}`} className="rounded-[var(--radius-card)] border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <h3 id={`review-${step}`} className="flex items-center gap-2 font-semibold text-ink">
          <StatusDot ok={ok} />
          {title}
        </h3>
        <button type="button" onClick={() => onEdit(step)} className="rounded-full px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-soft" aria-label={`Edit ${title}`}>
          Edit
        </button>
      </div>
      <dl className="grid gap-x-6 gap-y-3 px-4 py-4 text-sm sm:grid-cols-[10rem_1fr] sm:px-5">{children}</dl>
      {!ok && <p className="border-t border-line px-4 py-3 text-sm text-danger sm:px-5">Some required details are missing in this step.</p>}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </>
  );
}

export function StatusDot({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="grid size-5 place-items-center rounded-full bg-accent text-white">
      <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="sr-only">Complete</span>
    </span>
  ) : (
    <span className="grid size-5 place-items-center rounded-full border-2 border-dashed border-ink/25">
      <span className="sr-only">Incomplete</span>
    </span>
  );
}
