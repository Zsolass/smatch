"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Arrow, Button, ButtonLink } from "@/components/ui/Button";
import { isWorkTypeId, workTypeById } from "@/config/case-submission";
import { siteConfig } from "@/config/site";
import { demoAdapter, type CaseSubmissionAdapter, type SubmissionReceipt } from "@/lib/case-submission/adapter";
import { exampleDraft, loadExampleFiles } from "@/lib/case-submission/example";
import { firstInvalidStep, formatDate, STEPS, summarizeSelection, validateStep, type CaseDraft, type CaseFile } from "@/lib/case-submission/model";
import { initialState, reducer } from "@/lib/case-submission/reducer";
import { CaseSummary } from "./CaseSummary";
import { FilesStep } from "./FilesStep";
import { PracticeStep } from "./PracticeStep";
import { RestorationStep } from "./RestorationStep";
import { ReviewStep } from "./ReviewStep";

// Field ids in the order they appear, used to focus the first problem.
const FIELD_ORDER = ["practiceName", "dentistName", "email", "phone", "caseReference", "dueDate", "workType", "material", "selection", "files"];

function focusFirstError(errors: Record<string, string>) {
  const key = FIELD_ORDER.find((k) => errors[k]) ?? Object.keys(errors).find((k) => k.startsWith("bridge:"));
  if (!key) return;
  const id = key.startsWith("bridge:") ? `case-bridge-${key.slice(7)}` : `case-${key}`;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  el.focus({ preventScroll: true });
}

export function CaseSubmission({ adapter = demoAdapter }: { adapter?: CaseSubmissionAdapter }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [receipt, setReceipt] = useState<{ receipt: SubmissionReceipt; draft: CaseDraft } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingExample, setLoadingExample] = useState(false);
  const [exampleNote, setExampleNote] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const filesRef = useRef<CaseFile[]>([]);
  const searchParams = useSearchParams();
  const preselected = searchParams.get("type");
  const { draft, step, showErrors } = state;

  useEffect(() => {
    filesRef.current = draft.files;
  }, [draft.files]);

  // A service CTA can open the form with its work type preselected.
  useEffect(() => {
    if (isWorkTypeId(preselected)) dispatch({ type: "workType", workType: preselected, silent: true });
  }, [preselected]);

  // Free image previews when leaving the page.
  useEffect(() => () => filesRef.current.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl)), []);

  const errors = showErrors ? validateStep(step, draft) : {};
  const errorCount = Object.keys(errors).length;

  const goto = useCallback(
    (next: number, fromReview?: boolean) => {
      dispatch({ type: "goto", step: next, fromReview });
      requestAnimationFrame(() => {
        headingRef.current?.focus({ preventScroll: true });
        document.getElementById("wizard-top")?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      });
    },
    [],
  );

  function next() {
    const errs = validateStep(step, draft);
    if (Object.keys(errs).length) {
      dispatch({ type: "showErrors" });
      requestAnimationFrame(() => focusFirstError(errs));
      return;
    }
    goto(state.returnToReview ? 3 : step + 1);
  }

  async function submit() {
    const invalid = firstInvalidStep(draft);
    if (invalid !== -1) {
      goto(invalid);
      dispatch({ type: "showErrors" });
      requestAnimationFrame(() => requestAnimationFrame(() => focusFirstError(validateStep(invalid, draft))));
      return;
    }
    setSubmitting(true);
    try {
      const result = await adapter.submit(draft);
      setReceipt({ receipt: result, draft });
      window.scrollTo({ top: 0 });
    } finally {
      setSubmitting(false);
    }
  }

  function revokeAll(files: CaseFile[]) {
    files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
  }

  async function loadExample() {
    setLoadingExample(true);
    try {
      const files = await loadExampleFiles();
      const hadData = JSON.stringify({ ...draft, files: [] }) !== JSON.stringify({ ...initialState().draft, files: [] }) || draft.files.length > 0;
      revokeAll(draft.files);
      dispatch({ type: "loadDraft", draft: exampleDraft(files) });
      setExampleNote(hadData ? "Example case DEMO-001 loaded. It replaced what you had entered." : "Example case DEMO-001 loaded. Step through it or jump to the review.");
    } catch {
      setExampleNote("The example files couldn't be loaded. Please try again.");
    } finally {
      setLoadingExample(false);
    }
  }

  function startNew() {
    revokeAll(receipt?.draft.files ?? draft.files);
    setReceipt(null);
    setExampleNote(null);
    dispatch({ type: "reset" });
    window.scrollTo({ top: 0 });
  }

  if (receipt) return <SuccessView receipt={receipt.receipt} draft={receipt.draft} onNew={startNew} />;

  return (
    <div id="wizard-top" className="scroll-mt-[calc(var(--header-height)+1rem)]">
      <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-warm/35 bg-[#fbf3ea] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-warm/20 text-[#8a5a1f]" aria-hidden="true">
            <svg viewBox="0 0 16 16" className="size-4" fill="currentColor">
              <path d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 5.25a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0V7.5A.75.75 0 0 0 8 6.75Zm0-2.5a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z" />
            </svg>
          </span>
          <div>
            <p className="font-semibold text-ink">Demo only. Use sample files and fictional case details.</p>
            <p className="text-sm text-ink-soft">Nothing you enter or attach leaves your browser. No sign-up needed.</p>
          </div>
        </div>
        <Button onClick={loadExample} disabled={loadingExample} variant="primary" className="shrink-0 bg-night hover:bg-night-soft">
          {loadingExample ? "Loading…" : "Load example case"}
        </Button>
      </div>
      {exampleNote && (
        <p role="status" className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-accent-soft px-4 py-2.5 text-sm text-accent-strong">
          {exampleNote}
          <span className="flex shrink-0 gap-3">
            {step !== 3 && (
              <button type="button" className="font-medium underline underline-offset-2" onClick={() => goto(3)}>
                Go to review
              </button>
            )}
            <button type="button" className="text-ink-soft" onClick={() => setExampleNote(null)} aria-label="Dismiss message">
              ✕
            </button>
          </span>
        </p>
      )}

      <Stepper step={step} furthest={state.furthest} draft={draft} onSelect={(s) => goto(s)} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
        <div className="lg:hidden">
          <CaseSummary draft={draft} step={step} />
        </div>

        <div className="min-w-0">
          <div className="rounded-[1.5rem] border border-line bg-paper/40 p-4 sm:p-6 lg:p-8">
            <p className="text-sm font-medium text-accent">
              Step {step + 1} of {STEPS.length}
            </p>
            <h2 ref={headingRef} tabIndex={-1} className="mt-1 text-2xl font-semibold tracking-tight text-ink outline-none sm:text-3xl">
              {STEPS[step]!.title}
            </h2>

            {showErrors && errorCount > 0 && (
              <div role="alert" className="mt-5 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
                <p className="font-semibold">
                  {errorCount === 1 ? "One thing needs your attention" : `${errorCount} things need your attention`} before you continue.
                </p>
              </div>
            )}

            <div className="mt-6">
              {step === 0 && <PracticeStep practice={draft.practice} errors={errors} dispatch={dispatch} />}
              {step === 1 && <RestorationStep restoration={draft.restoration} errors={errors} notice={state.notice} dispatch={dispatch} />}
              {step === 2 && (
                <FilesStep
                  files={draft.files}
                  instructions={draft.instructions}
                  errors={errors}
                  dispatch={dispatch}
                  onRemove={(f) => {
                    if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
                    dispatch({ type: "removeFile", id: f.id });
                  }}
                />
              )}
              {step === 3 && <ReviewStep draft={draft} onEdit={(s) => goto(s, true)} />}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {step > 0 && (
                  <Button variant="ghost" onClick={() => goto(step - 1)}>
                    <Arrow className="rotate-180" /> Back
                  </Button>
                )}
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                {state.returnToReview && step < 3 && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const errs = validateStep(step, draft);
                      if (Object.keys(errs).length) {
                        dispatch({ type: "showErrors" });
                        requestAnimationFrame(() => focusFirstError(errs));
                      } else goto(3);
                    }}
                  >
                    Save and return to review
                  </Button>
                )}
                {step < 3 ? (
                  !state.returnToReview && (
                    <Button onClick={next}>
                      Next: {STEPS[step + 1]!.title} <Arrow />
                    </Button>
                  )
                ) : (
                  <Button onClick={submit} disabled={submitting} size="lg">
                    {submitting ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                        Submitting…
                      </>
                    ) : (
                      "Submit demo case"
                    )}
                  </Button>
                )}
              </div>
            </div>
            {step === 3 && <p className="mt-3 text-right text-xs text-ink-soft">Submitting completes the demo. No case or files are sent to a laboratory.</p>}
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-height)+1.5rem)]">
            <CaseSummary draft={draft} step={step} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stepper({ step, furthest, draft, onSelect }: { step: number; furthest: number; draft: CaseDraft; onSelect: (s: number) => void }) {
  return (
    <nav aria-label="Case submission steps" className="mt-6">
      <ol className="grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => {
          const done = i < 3 && i !== step && Object.keys(validateStep(i, draft)).length === 0 && i <= furthest;
          const reachable = i <= furthest;
          const current = i === step;
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onSelect(i)}
                aria-current={current ? "step" : undefined}
                className={`group flex w-full flex-col gap-2 text-left disabled:cursor-not-allowed ${reachable && !current ? "cursor-pointer" : ""}`}
              >
                <span className={`h-1.5 w-full rounded-full transition-colors ${current ? "bg-accent" : done ? "bg-accent/45" : "bg-line"}`} aria-hidden="true" />
                <span className="flex items-center gap-2">
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                      current ? "bg-accent text-white" : done ? "bg-accent-soft text-accent-strong" : "bg-white text-ink-soft ring-1 ring-line"
                    }`}
                  >
                    {done ? (
                      <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                        <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className={`hidden text-sm md:inline ${current ? "font-semibold text-ink" : reachable ? "text-ink-soft group-hover:text-ink" : "text-ink-soft/60"}`}>{s.title}</span>
                  <span className="sr-only md:hidden">{s.title}</span>
                  {done && <span className="sr-only"> (complete)</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function SuccessView({ receipt, draft, onNew }: { receipt: SubmissionReceipt; draft: CaseDraft; onNew: () => void }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const r = draft.restoration;
  const type = r.workType ? workTypeById[r.workType] : null;
  const selection = summarizeSelection(r);
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-[1.75rem] border border-line bg-white p-6 text-center shadow-[var(--shadow-card)] sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent-soft text-accent">
          <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 ref={ref} tabIndex={-1} className="mt-5 text-3xl font-semibold tracking-tight text-ink outline-none">
          Demo case submitted
        </h2>
        <p className="mt-2 text-ink-soft">
          Demo reference <strong className="font-semibold text-ink tabular-nums">{receipt.caseId}</strong>
        </p>
        <p role="status" className="mt-6 rounded-xl border border-warm/40 bg-[#fbf3ea] px-4 py-3 text-sm font-medium text-ink">
          Demo completed. No case or files were sent to a laboratory.
        </p>

        <dl className="mt-6 grid gap-x-6 gap-y-2 rounded-xl bg-paper p-5 text-left text-sm sm:grid-cols-[9rem_1fr]">
          <dt className="text-ink-soft">Practice</dt>
          <dd className="font-medium">{draft.practice.practiceName}</dd>
          <dt className="text-ink-soft">Case reference</dt>
          <dd className="font-medium">{draft.practice.caseReference}</dd>
          <dt className="text-ink-soft">Requested date</dt>
          <dd className="font-medium">{formatDate(draft.practice.dueDate)}</dd>
          <dt className="text-ink-soft">Restoration</dt>
          <dd className="font-medium">
            {type?.label} · {r.material}
            {r.shade ? ` · ${r.shade}` : ""}
          </dd>
          <dt className="text-ink-soft">{type?.selection === "arch" ? "Arch" : "Teeth"}</dt>
          <dd className="font-medium">
            {selection?.lines.map((l) => (
              <span key={l.label} className="block">
                {l.label}
                {type?.selection === "bridge" && <span className="font-normal text-ink-soft"> — {l.detail}</span>}
              </span>
            ))}
          </dd>
          <dt className="text-ink-soft">Files</dt>
          <dd className="font-medium">{draft.files.length} attached (kept in your browser only)</dd>
        </dl>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={onNew}>Start a new demo case</Button>
          <ButtonLink href="/" variant="secondary">
            Back to website
          </ButtonLink>
        </div>
      </div>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Run a dental lab and want this for your dentists?{" "}
        <Link href="/#inquire" className="font-medium text-accent underline underline-offset-2">
          {siteConfig.inquiry.ctaLabel}
        </Link>
      </p>
    </div>
  );
}
