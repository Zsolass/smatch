import type { CountryOption } from "@/lib/countries";
import { callingCode } from "@/lib/validation";
import { Field } from "./FormField";

interface Props {
  id: string;
  label?: string;
  error?: string;
  country: string;
  phone: string;
  countries: CountryOption[];
  onCountry: (code: string) => void;
  onPhone: (value: string) => void;
  onBlur: () => void;
}

/** Phone number with a country-code picker; required in both forms. */
export function PhoneField({ id, label = "Phone number", error, country, phone, countries, onCountry, onPhone, onBlur }: Props) {
  return (
    <Field id={id} label={label} required hint="With country code" error={error}>
      <div className={`flex rounded-xl border bg-paper/50 transition-colors focus-within:border-accent focus-within:bg-white focus-within:ring-2 focus-within:ring-accent/20 ${error ? "border-danger" : "border-line"}`}>
        <div className="relative flex shrink-0 items-center border-r border-line pr-2 pl-3.5 text-base text-ink">
          <span aria-hidden="true" className="whitespace-nowrap">
            {country ? `${country} ${callingCode(country)}` : "Code"}
          </span>
          <svg viewBox="0 0 16 16" className="ml-1 size-3.5 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <select aria-label="Phone country code" className="absolute inset-0 cursor-pointer opacity-0" value={country} onChange={(e) => onCountry(e.target.value)} onBlur={onBlur}>
            <option value="">Country code</option>
            {/* Keeps the current code selectable before the full list has loaded. */}
            {country && !countries.length && <option value={country}>{country}</option>}
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.dial})
              </option>
            ))}
          </select>
        </div>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
          aria-required="true"
          className="min-w-0 flex-1 rounded-r-xl bg-transparent px-3.5 py-3 text-base outline-none"
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          onBlur={onBlur}
          maxLength={32}
        />
      </div>
    </Field>
  );
}
