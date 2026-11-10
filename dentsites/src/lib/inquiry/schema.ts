// Validation for the Inquire (website quote) form on the clinic-owner page.
// Shared by the browser form and the Worker endpoint, so both enforce exactly
// the same rules.

import { checkPhone, clean, EMAIL, isCountry } from "../validation";
import { US_STATES } from "./us-states";

export interface InquiryInput {
  clinicName: string;
  companyName: string;
  contactName: string;
  email: string;
  phoneCountry: string;
  phone: string;
  country: string;
  region: string;
  city: string;
  website: string;
  message: string;
}

export interface Inquiry extends InquiryInput {
  /** E.164, e.g. +3612345678 */
  phoneE164: string;
  /** Human-friendly international format, e.g. +36 1 234 5678 */
  phoneDisplay: string;
}

export type InquiryField = keyof InquiryInput;
export type InquiryErrors = Partial<Record<InquiryField, string>>;

export const LIMITS: Record<InquiryField, number> = {
  clinicName: 120,
  companyName: 160,
  contactName: 120,
  email: 254,
  phoneCountry: 2,
  phone: 32,
  country: 2,
  region: 120,
  city: 120,
  website: 300,
  message: 4000,
};

export const EMPTY_INQUIRY: InquiryInput = {
  clinicName: "",
  companyName: "",
  contactName: "",
  email: "",
  phoneCountry: "",
  phone: "",
  country: "",
  region: "",
  city: "",
  website: "",
  message: "",
};

/** Accepts "example.com", "www.example.com/path" or a full http(s) URL. */
export function normalizeWebsite(value: string): string | null {
  const raw = value.trim();
  if (!raw) return "";
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!/^[a-z\d-]+(\.[a-z\d-]+)*\.[a-z]{2,}$/i.test(url.hostname)) return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Coerces unknown input (e.g. a JSON body) into trimmed strings. */
export function coerceInquiry(body: unknown): InquiryInput {
  const src = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const out = { ...EMPTY_INQUIRY };
  for (const key of Object.keys(EMPTY_INQUIRY) as InquiryField[]) out[key] = clean(src[key]);
  out.phoneCountry = out.phoneCountry.toUpperCase();
  out.country = out.country.toUpperCase();
  out.email = out.email.toLowerCase();
  return out;
}

export function validateInquiry(input: InquiryInput): { ok: true; data: Inquiry } | { ok: false; errors: InquiryErrors } {
  const e: InquiryErrors = {};
  const v = input;

  for (const key of Object.keys(LIMITS) as InquiryField[]) {
    if (v[key].length > LIMITS[key]) e[key] = `Keep this under ${LIMITS[key]} characters.`;
  }

  if (!v.clinicName) e.clinicName ??= "Enter your clinic's name.";
  if (!v.contactName) e.contactName ??= "Enter the contact person's full name.";

  if (!v.email) e.email ??= "Enter your work email.";
  else if (!EMAIL.test(v.email)) e.email ??= "Enter a valid email address, like name@yourclinic.com.";

  const phone = checkPhone(v.phone, v.phoneCountry);
  if (!phone.ok) e.phone ??= phone.error;

  if (!v.country) e.country ??= "Choose your country.";
  else if (!isCountry(v.country)) e.country ??= "Choose a country from the list.";

  if (v.country === "US") {
    if (!v.region) e.region ??= "Choose your state.";
    else if (!US_STATES.some((s) => s.code === v.region)) e.region ??= "Choose a state from the list.";
  }

  if (!v.city) e.city ??= "Enter your city.";

  let website = "";
  if (v.website) {
    const normalized = normalizeWebsite(v.website);
    if (normalized === null) e.website ??= "Enter a valid web address, like yourclinic.com.";
    else website = normalized;
  }

  if (Object.keys(e).length || !phone.ok) return { ok: false, errors: e };
  return { ok: true, data: { ...v, website, phoneE164: phone.e164, phoneDisplay: phone.display } };
}

export const FIELD_LABELS: Record<InquiryField, string> = {
  clinicName: "Clinic name",
  companyName: "Company / Legal name",
  contactName: "Contact person",
  email: "Work email",
  phoneCountry: "Country code",
  phone: "Phone number",
  country: "Country",
  region: "State / Region",
  city: "City",
  website: "Current website",
  message: "Message / Requirements",
};
