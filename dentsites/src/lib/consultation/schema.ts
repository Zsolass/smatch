// Validation for the consultation request form. Shared by the browser form and
// the Worker endpoint, so both enforce exactly the same rules.

import { checkPhone, clean, EMAIL } from "../validation";

export const CONTACT_METHODS = ["call", "text", "email"] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export interface ConsultationInput {
  fullName: string;
  phoneCountry: string;
  phone: string;
  email: string;
  /** Treatment id, or "" for "not sure yet". */
  treatment: string;
  /** Location id; required when the clinic has several locations. */
  location: string;
  contactMethod: string;
  message: string;
}

export interface ConsultationRequest extends ConsultationInput {
  /** E.164, e.g. +14155552671 */
  phoneE164: string;
  /** Human-friendly international format, e.g. +1 415 555 2671 */
  phoneDisplay: string;
}

export type ConsultationField = keyof ConsultationInput;
export type ConsultationErrors = Partial<Record<ConsultationField, string>>;

/** What the clinic's configuration allows: see consultationOptions() in options.ts. */
export interface ConsultationOptions {
  treatments: string[];
  locations: string[];
  contactMethods: string[];
}

export const LIMITS: Record<ConsultationField, number> = {
  fullName: 120,
  phoneCountry: 2,
  phone: 32,
  email: 254,
  treatment: 64,
  location: 64,
  contactMethod: 16,
  message: 1000,
};

export const EMPTY_CONSULTATION: ConsultationInput = {
  fullName: "",
  phoneCountry: "",
  phone: "",
  email: "",
  treatment: "",
  location: "",
  contactMethod: "",
  message: "",
};

export const FIELD_LABELS: Record<ConsultationField, string> = {
  fullName: "Full name",
  phoneCountry: "Country code",
  phone: "Phone number",
  email: "Email",
  treatment: "Treatment interest",
  location: "Clinic location",
  contactMethod: "Preferred contact",
  message: "Message",
};

/** Coerces unknown input (e.g. a JSON body) into trimmed strings. */
export function coerceConsultation(body: unknown): ConsultationInput {
  const src = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const out = { ...EMPTY_CONSULTATION };
  for (const key of Object.keys(EMPTY_CONSULTATION) as ConsultationField[]) out[key] = clean(src[key]);
  out.phoneCountry = out.phoneCountry.toUpperCase();
  out.email = out.email.toLowerCase();
  return out;
}

export function validateConsultation(
  input: ConsultationInput,
  options: ConsultationOptions,
): { ok: true; data: ConsultationRequest } | { ok: false; errors: ConsultationErrors } {
  const e: ConsultationErrors = {};
  const v = input;

  for (const key of Object.keys(LIMITS) as ConsultationField[]) {
    if (v[key].length > LIMITS[key]) e[key] = `Keep this under ${LIMITS[key]} characters.`;
  }

  if (!v.fullName) e.fullName ??= "Enter your full name.";
  else if (v.fullName.length < 2) e.fullName ??= "Enter your full name.";

  const phone = checkPhone(v.phone, v.phoneCountry);
  if (!phone.ok) e.phone ??= phone.error;

  if (v.email && !EMAIL.test(v.email)) e.email ??= "Enter a valid email address, like name@example.com.";

  if (v.treatment && !options.treatments.includes(v.treatment)) e.treatment ??= "Choose a treatment from the list.";

  if (options.locations.length > 1) {
    if (!v.location) e.location ??= "Choose the clinic you would like to visit.";
    else if (!options.locations.includes(v.location)) e.location ??= "Choose a clinic from the list.";
  } else if (v.location && !options.locations.includes(v.location)) {
    e.location ??= "Choose a clinic from the list.";
  }

  if (v.contactMethod && !options.contactMethods.includes(v.contactMethod)) e.contactMethod ??= "Choose how we should contact you.";
  if (v.contactMethod === "email" && !v.email) e.email ??= "Enter your email address so we can reply by email.";

  if (Object.keys(e).length || !phone.ok) return { ok: false, errors: e };
  return { ok: true, data: { ...v, phoneE164: phone.e164, phoneDisplay: phone.display } };
}
