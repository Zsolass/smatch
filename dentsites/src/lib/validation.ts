// Field checks shared by the consultation request and the website inquiry,
// in the browser and in the Worker.

import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/min";

export const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;

const COUNTRIES = new Set<string>(getCountries());

export function isCountry(code: string): code is CountryCode {
  return COUNTRIES.has(code);
}

export function callingCode(country: string): string {
  return isCountry(country) ? `+${getCountryCallingCode(country)}` : "";
}

/** Trims a value from an untrusted source to a plain string. */
export const clean = (v: unknown) => (typeof v === "string" ? v.replace(/\u0000/g, "").trim() : "");

export type PhoneResult = { ok: true; e164: string; display: string } | { ok: false; error: string };

/** Checks a phone number against its country code and returns it in E.164 and readable form. */
export function checkPhone(phone: string, country: string): PhoneResult {
  if (!phone) return { ok: false, error: "Enter a phone number." };
  if (!isCountry(country)) return { ok: false, error: "Choose the country code for this number." };
  const parsed = parsePhoneNumberFromString(phone, country);
  if (!parsed || !parsed.isValid()) return { ok: false, error: `Enter a valid phone number for ${callingCode(country)}.` };
  return { ok: true, e164: parsed.number, display: parsed.formatInternational() };
}
