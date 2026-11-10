"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { CallLink } from "@/components/site/BookingLink";
import { Arrow, Button, buttonClass } from "@/components/ui/Button";
import { Field, inputProps } from "@/components/ui/FormField";
import { PhoneField } from "@/components/ui/PhoneField";
import { clinic, hasMultipleLocations, mainLocation } from "@/config/clinic";
import { siteConfig } from "@/config/site";
import { enabledTreatments } from "@/config/treatments";
import { track } from "@/lib/analytics";
import { bookingMode, usesBookingLink } from "@/lib/booking";
import { createDemoAdapter, createHttpAdapter, type ConsultationAdapter } from "@/lib/consultation/adapter";
import { CLINIC_COUNTRY, CONTACT_METHOD_LABELS, consultationOptions } from "@/lib/consultation/options";
import { EMPTY_CONSULTATION, FIELD_LABELS, LIMITS, validateConsultation, type ConsultationErrors, type ConsultationField, type ConsultationInput } from "@/lib/consultation/schema";
import { useCountries } from "@/lib/countries";

type Status = { state: "idle" } | { state: "submitting" } | { state: "error"; message: string } | { state: "success"; reference: string };

// Field order for the error summary and for focusing the first error.
const ORDER: ConsultationField[] = ["fullName", "phone", "email", "treatment", "location", "contactMethod", "message"];

const options = consultationOptions();
const newKey = () => crypto.randomUUID();

const initialValues = (treatment?: string): ConsultationInput => ({
  ...EMPTY_CONSULTATION,
  phoneCountry: CLINIC_COUNTRY,
  contactMethod: options.contactMethods[0] ?? "",
  treatment: treatment && options.treatments.includes(treatment) ? treatment : "",
  // With one clinic there is nothing to choose.
  location: hasMultipleLocations ? "" : mainLocation.id,
});

interface Props {
  /** Treatment id to preselect, e.g. when the form is opened from a treatment page. */
  initialTreatment?: string;
  /** Where the form sits, for analytics (no personal data). */
  placement: string;
  /** Overrides the adapter chosen by the booking mode (see src/config/site.ts). */
  adapter?: ConsultationAdapter;
}

/**
 * The short consultation request. In demo mode nothing leaves the browser; in
 * request mode the Worker stores the request and success is shown only after
 * it confirms. In link mode the clinic's booking system takes over.
 */
export function ConsultationForm({ initialTreatment, placement, adapter: adapterProp }: Props) {
  const adapter = useMemo(() => adapterProp ?? (bookingMode() === "request" ? createHttpAdapter(siteConfig.booking.endpoint) : createDemoAdapter()), [adapterProp]);
  const countries = useCountries();
  const [values, setValues] = useState<ConsultationInput>(() => initialValues(initialTreatment));
  const [errors, setErrors] = useState<ConsultationErrors>({});
  const [touched, setTouched] = useState<Partial<Record<ConsultationField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const idempotencyKey = useRef("");
  const startedAt = useRef(0);
  const sending = useRef(false);
  const honeypot = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const id = (f: string) => `${uid}-${f}`;

  useEffect(() => {
    idempotencyKey.current = newKey();
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (status.state === "success") successRef.current?.focus();
  }, [status]);

  if (usesBookingLink()) return <BookingSystemPanel />;

  const validate = (next: ConsultationInput) => {
    const result = validateConsultation(next, options);
    return result.ok ? {} : result.errors;
  };

  const update = (field: ConsultationField, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (submitted || touched[field] || (field === "contactMethod" && touched.email)) setErrors(validate(next));
  };

  const blur = (field: ConsultationField) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate(values));
  };

  const showError = (field: ConsultationField) => (submitted || touched[field] ? errors[field] : undefined);

  const fail = (message: string) => {
    setStatus({ state: "error", message });
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // A second click or Enter while the request is on its way does nothing.
    if (sending.current) return;
    setSubmitted(true);
    const result = validateConsultation(values, options);
    if (!result.ok) {
      setErrors(result.errors);
      fail("Please correct the highlighted fields.");
      return;
    }
    setErrors({});
    sending.current = true;
    setStatus({ state: "submitting" });
    try {
      const outcome = await adapter.submit(values, {
        idempotencyKey: idempotencyKey.current,
        hp: honeypot.current?.value ?? "",
        elapsedMs: Date.now() - startedAt.current,
      });
      if (outcome.ok) {
        setStatus({ state: "success", reference: outcome.reference });
        track("consultation_request", { placement, treatment: values.treatment || undefined, mode: adapter.kind });
      } else {
        // Everything typed stays in the form.
        if (outcome.fieldErrors) setErrors(outcome.fieldErrors);
        fail(outcome.message);
      }
    } catch {
      fail("Something went wrong. Your details are still in the form; please try again, or call us.");
    } finally {
      sending.current = false;
    }
  }

  function reset() {
    setValues((v) => ({ ...initialValues(initialTreatment), phoneCountry: v.phoneCountry }));
    setErrors({});
    setTouched({});
    setSubmitted(false);
    idempotencyKey.current = newKey();
    startedAt.current = Date.now();
    setStatus({ state: "idle" });
  }

  const demo = adapter.kind === "demo";
  const card = "rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]";

  if (status.state === "success") {
    const firstName = values.fullName.split(/\s+/)[0];
    return (
      <div ref={successRef} tabIndex={-1} role="status" data-consultation-form className={`${card} p-7 text-center outline-none sm:p-10`}>
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-accent-soft text-accent">
          <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h3 className="display mt-5 text-3xl text-balance text-ink">{demo ? "Request received (demo)" : `Thank you, ${firstName}. We have your request.`}</h3>
        {demo ? (
          <p className="mx-auto mt-3 max-w-md text-ink-soft">
            On a live website, {clinic.name} would now have your request and would contact you to arrange a time.{" "}
            <strong className="font-semibold text-ink">This is a demonstration: nothing was sent, and no appointment has been booked.</strong>
          </p>
        ) : (
          <p className="mx-auto mt-3 max-w-md text-ink-soft">
            A member of our team will contact you to arrange your consultation.{" "}
            <strong className="font-semibold text-ink">Your appointment is booked once we have agreed a time with you.</strong>
          </p>
        )}
        <p className="mt-5 text-sm text-ink-soft">
          Reference: <span className="font-semibold text-ink">{status.reference}</span>
        </p>
        <Button variant="secondary" className="mt-7" onClick={reset}>
          Send another request
        </Button>
      </div>
    );
  }

  const errorList = ORDER.filter((f) => showError(f));
  const submitting = status.state === "submitting";

  return (
    <form noValidate onSubmit={onSubmit} data-consultation-form aria-describedby={id("privacy")} className={`${card} p-5 sm:p-8`}>
      {demo && (
        <p className="mb-6 flex items-start gap-3 rounded-xl bg-warm/10 px-4 py-3 text-[0.9375rem] text-ink ring-1 ring-warm/25">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-warm" aria-hidden="true" />
          <span>
            <strong className="font-semibold">Demo form.</strong> Try it with made-up details: nothing you enter leaves your browser, and no appointment is booked.
          </span>
        </p>
      )}

      {status.state === "error" && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="mb-6 rounded-xl border border-danger/25 bg-danger-soft p-4 text-[0.9375rem] text-danger outline-none">
          <p className="font-semibold">{status.message}</p>
          {errorList.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {errorList.map((f) => (
                <li key={f}>
                  <a href={`#${id(f)}`} className="underline underline-offset-2">
                    {FIELD_LABELS[f]}: {showError(f)}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
        <Field id={id("fullName")} label={FIELD_LABELS.fullName} required error={showError("fullName")}>
          <input {...inputProps(id("fullName"), showError("fullName"))} autoComplete="name" value={values.fullName} onChange={(e) => update("fullName", e.target.value)} onBlur={() => blur("fullName")} maxLength={LIMITS.fullName} />
        </Field>

        <PhoneField
          id={id("phone")}
          error={showError("phone")}
          country={values.phoneCountry}
          phone={values.phone}
          countries={countries}
          onCountry={(code) => update("phoneCountry", code)}
          onPhone={(value) => update("phone", value)}
          onBlur={() => blur("phone")}
        />

        <Field id={id("email")} label={FIELD_LABELS.email} hint={values.contactMethod === "email" ? undefined : "Optional"} required={values.contactMethod === "email"} error={showError("email")}>
          <input {...inputProps(id("email"), showError("email"))} type="email" inputMode="email" autoComplete="email" value={values.email} onChange={(e) => update("email", e.target.value)} onBlur={() => blur("email")} maxLength={LIMITS.email} />
        </Field>

        <Field id={id("treatment")} label={FIELD_LABELS.treatment} hint="Optional" error={showError("treatment")}>
          <select {...inputProps(id("treatment"), showError("treatment"))} value={values.treatment} onChange={(e) => update("treatment", e.target.value)} onBlur={() => blur("treatment")}>
            <option value="">Not sure yet</option>
            {enabledTreatments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>

        {hasMultipleLocations && (
          <Field id={id("location")} label={FIELD_LABELS.location} required error={showError("location")} className="sm:col-span-2">
            <select {...inputProps(id("location"), showError("location"))} value={values.location} onChange={(e) => update("location", e.target.value)} onBlur={() => blur("location")}>
              <option value="">Choose a clinic</option>
              {clinic.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} · {l.address.join(", ")}
                </option>
              ))}
            </select>
          </Field>
        )}

        {options.contactMethods.length > 0 && (
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-[0.9375rem] font-semibold text-ink">How should we contact you?</legend>
            <div className="flex flex-wrap gap-2">
              {options.contactMethods.map((method) => (
                <label
                  key={method}
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-line bg-paper/50 px-4 text-[0.9375rem] text-ink transition-colors has-checked:border-accent has-checked:bg-accent-soft has-checked:font-semibold has-focus-visible:ring-2 has-focus-visible:ring-accent/40"
                >
                  <input type="radio" name={id("contactMethod")} value={method} checked={values.contactMethod === method} onChange={() => update("contactMethod", method)} className="size-4 accent-[var(--color-accent)]" />
                  {CONTACT_METHOD_LABELS[method] ?? method}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <Field id={id("message")} label="Short message" hint="Optional" error={showError("message")} className="sm:col-span-2">
          <textarea {...inputProps(id("message"), showError("message"))} rows={3} placeholder="Anything you would like us to know before we call" value={values.message} onChange={(e) => update("message", e.target.value)} onBlur={() => blur("message")} maxLength={LIMITS.message} />
        </Field>
      </div>

      {/* Hidden from people; bots that fill every field are rejected. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={id("botcheck")}>Leave this field empty</label>
        <input ref={honeypot} id={id("botcheck")} name="botcheck_field" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="mt-7 flex flex-col gap-5 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p id={id("privacy")} className="max-w-sm text-sm leading-relaxed text-ink-soft">
          {demo ? "In this demo your details stay in your browser. A clinic's own site uses them only to arrange your consultation." : "We use these details only to arrange your consultation."} See the{" "}
          <Link href="/privacy" className="font-semibold text-accent underline underline-offset-2">
            privacy notice
          </Link>
          .
        </p>
        <Button type="submit" size="lg" disabled={submitting} aria-disabled={submitting} className="shrink-0">
          {submitting ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
              Sending…
            </>
          ) : (
            <>
              Request my consultation <Arrow />
            </>
          )}
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        {submitting ? "Sending your request" : ""}
      </p>
    </form>
  );
}

/** Link mode: the clinic's own booking system confirms appointments, so there is no request form. */
function BookingSystemPanel() {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-7 shadow-[var(--shadow-card)] sm:p-10">
      <h3 className="display text-3xl text-ink">Choose a time online</h3>
      <p className="mt-3 text-ink-soft">Our online booking system shows the available consultation times. Your appointment is confirmed there as soon as you choose one.</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <a href={siteConfig.booking.bookingUrl!} target="_blank" rel="noopener" className={buttonClass("primary", "lg")} data-analytics="booking_click" data-placement="booking-panel">
          {siteConfig.booking.ctaLabel} <Arrow />
          <span className="sr-only"> (opens the booking system in a new tab)</span>
        </a>
        <CallLink placement="booking-panel" size="lg" />
      </div>
    </div>
  );
}
