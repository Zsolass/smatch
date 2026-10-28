"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputProps } from "@/components/ui/FormField";
import { siteConfig } from "@/config/site";
import { callingCode, EMPTY_INQUIRY, FIELD_LABELS, isCountry, validateInquiry, type InquiryErrors, type InquiryField, type InquiryInput } from "@/lib/inquiry/schema";
import { US_STATES } from "@/lib/inquiry/us-states";
import { getCountries } from "libphonenumber-js/min";

type Status = { state: "idle" } | { state: "submitting" } | { state: "error"; message: string } | { state: "success"; id: string };

// Field order for focusing the first error.
const ORDER: InquiryField[] = ["labName", "companyName", "contactName", "email", "phone", "country", "region", "city", "website", "message"];

interface CountryOption {
  code: string;
  name: string;
  dial: string;
}

const noSubscribe = () => () => {};
/** False during server rendering and hydration, true afterwards. */
const useIsClient = () => useSyncExternalStore(noSubscribe, () => true, () => false);

function buildCountries(): CountryOption[] {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    names = null;
  }
  return getCountries()
    .map((code) => ({ code, name: names?.of(code) ?? code, dial: callingCode(code) }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

function localeRegion(): string {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region;
    return region && isCountry(region) ? region : "";
  } catch {
    return "";
  }
}

const newKey = () => crypto.randomUUID();

export function InquiryForm() {
  // Country names come from the browser's Intl data, which can differ from
  // Node's, so the lists and the locale default only appear after hydration.
  const isClient = useIsClient();
  const countries = useMemo(() => (isClient ? buildCountries() : []), [isClient]);
  const defaultPhoneCountry = useMemo(() => (isClient ? localeRegion() : ""), [isClient]);
  const [input, setValues] = useState<InquiryInput>(EMPTY_INQUIRY);
  // Until the user picks a code, the phone number uses the browser's region.
  const values = useMemo(() => ({ ...input, phoneCountry: input.phoneCountry || defaultPhoneCountry }), [input, defaultPhoneCountry]);
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [touched, setTouched] = useState<Partial<Record<InquiryField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [phoneCountryTouched, setPhoneCountryTouched] = useState(false);
  const idempotencyKey = useRef<string>("");
  const startedAt = useRef<number>(0);
  const honeypot = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  useEffect(() => {
    idempotencyKey.current = newKey();
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (status.state === "success") successRef.current?.focus();
  }, [status]);

  const validate = (next: InquiryInput) => {
    const result = validateInquiry(next);
    return result.ok ? {} : result.errors;
  };

  const update = (field: InquiryField, value: string) => {
    const next = { ...values, [field]: value };
    if (field === "country") {
      if (!phoneCountryTouched && isCountry(value)) next.phoneCountry = value;
      // A US state code means nothing elsewhere, and free text isn't a state.
      if ((values.country === "US") !== (value === "US")) next.region = "";
    }
    setValues(next);
    if (submitted || touched[field]) setErrors(validate(next));
  };

  const blur = (field: InquiryField) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate(values));
  };

  const showError = (field: InquiryField) => (submitted || touched[field] ? errors[field] : undefined);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.state === "submitting") return;
    setSubmitted(true);
    const result = validateInquiry(values);
    if (!result.ok) {
      setErrors(result.errors);
      setStatus({ state: "error", message: "Please correct the highlighted fields." });
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setErrors({});
    setStatus({ state: "submitting" });

    let response: Response;
    try {
      response = await fetch(siteConfig.inquiry.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...values,
          idempotencyKey: idempotencyKey.current,
          hp: honeypot.current?.value ?? "",
          elapsedMs: Date.now() - startedAt.current,
        }),
      });
    } catch {
      setStatus({ state: "error", message: "We couldn't reach the server. Check your connection and try again; your details are still here." });
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    const isJson = (response.headers.get("Content-Type") ?? "").includes("application/json");
    const data = isJson ? ((await response.json().catch(() => null)) as Record<string, unknown> | null) : null;

    if (response.ok && data?.ok === true && typeof data.id === "string") {
      setStatus({ state: "success", id: data.id });
      return;
    }

    let message: string;
    if (!data) {
      // No JSON API behind the endpoint: a deployment without the Worker.
      message = "The inquiry service isn't set up on this deployment yet, so your inquiry was not sent. Your details are still in the form.";
    } else {
      if (data.error === "validation" && data.fieldErrors && typeof data.fieldErrors === "object") {
        setErrors(data.fieldErrors as InquiryErrors);
      }
      message = typeof data.message === "string" ? data.message : "Something went wrong. Please try again.";
      if (data.error === "not_configured") message = `${message} Your inquiry was not sent; your details are still in the form.`;
    }
    setStatus({ state: "error", message });
    requestAnimationFrame(() => summaryRef.current?.focus());
  }

  function reset() {
    setValues((v) => ({ ...EMPTY_INQUIRY, phoneCountry: v.phoneCountry }));
    setErrors({});
    setTouched({});
    setSubmitted(false);
    setPhoneCountryTouched(false);
    idempotencyKey.current = newKey();
    startedAt.current = Date.now();
    setStatus({ state: "idle" });
  }

  if (status.state === "success") {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="rounded-[var(--radius-card)] border border-accent/25 bg-white p-8 text-center shadow-[var(--shadow-card)] outline-none sm:p-12">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-accent-soft text-accent">
          <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="mt-5 text-xl font-semibold text-balance text-ink">{siteConfig.inquiry.successMessage}</p>
        <p className="mt-2 text-sm text-ink-soft">
          We&apos;ll reply to <strong className="font-medium text-ink">{values.email}</strong>.
        </p>
        <Button variant="secondary" className="mt-8" onClick={reset}>
          Send another inquiry
        </Button>
      </div>
    );
  }

  const errorList = ORDER.filter((f) => showError(f));
  const submitting = status.state === "submitting";
  const isUS = values.country === "US";
  const id = (f: string) => `${uid}-${f}`;

  return (
    <form noValidate onSubmit={onSubmit} aria-describedby={`${id("privacy")}`} className="rounded-[var(--radius-card)] border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-8">
      {status.state === "error" && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="mb-6 rounded-xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger outline-none">
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
        <Field id={id("labName")} label="Laboratory name" required error={showError("labName")}>
          <input {...inputProps(id("labName"), showError("labName"))} autoComplete="organization" value={values.labName} onChange={(e) => update("labName", e.target.value)} onBlur={() => blur("labName")} maxLength={120} />
        </Field>
        <Field id={id("companyName")} label="Company / Legal name" hint="If different from the lab name" error={showError("companyName")}>
          <input {...inputProps(id("companyName"), showError("companyName"))} value={values.companyName} onChange={(e) => update("companyName", e.target.value)} onBlur={() => blur("companyName")} maxLength={160} />
        </Field>
        <Field id={id("contactName")} label="Contact person" required error={showError("contactName")}>
          <input {...inputProps(id("contactName"), showError("contactName"))} autoComplete="name" value={values.contactName} onChange={(e) => update("contactName", e.target.value)} onBlur={() => blur("contactName")} maxLength={120} />
        </Field>
        <Field id={id("email")} label="Work email" required error={showError("email")}>
          <input {...inputProps(id("email"), showError("email"))} type="email" inputMode="email" autoComplete="email" value={values.email} onChange={(e) => update("email", e.target.value)} onBlur={() => blur("email")} maxLength={254} />
        </Field>

        <Field id={id("phone")} label="Phone number" required hint="With country code" error={showError("phone")}>
          <div className={`flex rounded-xl border bg-paper/60 transition-colors focus-within:border-accent focus-within:bg-white focus-within:ring-2 focus-within:ring-accent/20 ${showError("phone") ? "border-danger" : "border-line"}`}>
            <div className="relative flex shrink-0 items-center border-r border-line pr-2 pl-3 text-[0.9375rem] text-ink">
              <span aria-hidden="true" className="whitespace-nowrap">
                {values.phoneCountry ? `${values.phoneCountry} ${callingCode(values.phoneCountry)}` : "Code"}
              </span>
              <svg viewBox="0 0 16 16" className="ml-1 size-3.5 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <select
                aria-label="Phone country code"
                className="absolute inset-0 cursor-pointer opacity-0"
                value={values.phoneCountry}
                onChange={(e) => {
                  setPhoneCountryTouched(true);
                  update("phoneCountry", e.target.value);
                }}
                onBlur={() => blur("phone")}
              >
                <option value="">Country code</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.dial})
                  </option>
                ))}
              </select>
            </div>
            <input
              id={id("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              aria-invalid={showError("phone") ? true : undefined}
              aria-describedby={`${id("phone")}-hint${showError("phone") ? ` ${id("phone")}-error` : ""}`}
              aria-required="true"
              className="min-w-0 flex-1 rounded-r-xl bg-transparent px-3 py-3 text-[0.9375rem] outline-none"
              value={values.phone}
              onChange={(e) => update("phone", e.target.value)}
              onBlur={() => blur("phone")}
              maxLength={32}
            />
          </div>
        </Field>

        <Field id={id("country")} label="Country" required error={showError("country")}>
          <select {...inputProps(id("country"), showError("country"))} autoComplete="country" value={values.country} onChange={(e) => update("country", e.target.value)} onBlur={() => blur("country")}>
            <option value="">Select a country</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field id={id("region")} label={isUS ? "State" : "State / Region"} required={isUS} hint={isUS ? undefined : "Optional"} error={showError("region")}>
          {isUS ? (
            <select {...inputProps(id("region"), showError("region"))} autoComplete="address-level1" value={values.region} onChange={(e) => update("region", e.target.value)} onBlur={() => blur("region")}>
              <option value="">Select a state</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : (
            <input {...inputProps(id("region"), showError("region"))} autoComplete="address-level1" value={values.region} onChange={(e) => update("region", e.target.value)} onBlur={() => blur("region")} maxLength={120} />
          )}
        </Field>
        <Field id={id("city")} label="City" required error={showError("city")}>
          <input {...inputProps(id("city"), showError("city"))} autoComplete="address-level2" value={values.city} onChange={(e) => update("city", e.target.value)} onBlur={() => blur("city")} maxLength={120} />
        </Field>

        <Field id={id("website")} label="Current website" hint="Optional, e.g. yourlab.com" error={showError("website")} className="sm:col-span-2">
          <input {...inputProps(id("website"), showError("website"))} type="url" inputMode="url" autoComplete="url" placeholder="https://" value={values.website} onChange={(e) => update("website", e.target.value)} onBlur={() => blur("website")} maxLength={300} />
        </Field>
        <Field id={id("message")} label="Message / Requirements" hint="Optional: what should your website do?" error={showError("message")} className="sm:col-span-2">
          <textarea {...inputProps(id("message"), showError("message"))} rows={5} value={values.message} onChange={(e) => update("message", e.target.value)} onBlur={() => blur("message")} maxLength={4000} />
        </Field>
      </div>

      {/* Hidden from people; bots that fill every field are rejected. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={id("botcheck")}>Leave this field empty</label>
        <input ref={honeypot} id={id("botcheck")} name="botcheck_field" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="mt-7 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p id={id("privacy")} className="max-w-md text-xs leading-relaxed text-ink-soft">
          We use these details only to answer your inquiry and prepare a quote. No registration, and please don&apos;t include patient information.
          See our{" "}
          <Link href="/privacy" className="font-medium text-accent underline underline-offset-2">
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
            siteConfig.inquiry.submitLabel
          )}
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        {submitting ? "Sending your inquiry" : ""}
      </p>
    </form>
  );
}
