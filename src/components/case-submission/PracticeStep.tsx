"use client";

import { Field, inputProps } from "@/components/ui/FormField";
import { todayIso, type FieldErrors, type PracticeDetails } from "@/lib/case-submission/model";
import type { Action } from "@/lib/case-submission/reducer";

interface Props {
  practice: PracticeDetails;
  errors: FieldErrors;
  dispatch: (a: Action) => void;
}

export function PracticeStep({ practice, errors, dispatch }: Props) {
  const set = (field: keyof PracticeDetails) => (e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: "practice", field, value: e.target.value });
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Field id="case-practiceName" label="Practice name" required error={errors.practiceName}>
        <input {...inputProps("case-practiceName", errors.practiceName)} autoComplete="organization" value={practice.practiceName} onChange={set("practiceName")} maxLength={120} />
      </Field>
      <Field id="case-dentistName" label="Dentist" required hint="Contact for this case" error={errors.dentistName}>
        <input {...inputProps("case-dentistName", errors.dentistName)} autoComplete="name" value={practice.dentistName} onChange={set("dentistName")} maxLength={120} />
      </Field>
      <Field id="case-email" label="Email" required error={errors.email}>
        <input {...inputProps("case-email", errors.email)} type="email" inputMode="email" autoComplete="email" value={practice.email} onChange={set("email")} maxLength={254} />
      </Field>
      <Field id="case-phone" label="Phone" hint="Optional" error={errors.phone}>
        <input {...inputProps("case-phone", errors.phone)} type="tel" inputMode="tel" autoComplete="tel" value={practice.phone} onChange={set("phone")} maxLength={32} />
      </Field>
      <Field id="case-caseReference" label="Case reference / Patient code" required hint="Not the patient's name" error={errors.caseReference}>
        <input {...inputProps("case-caseReference", errors.caseReference)} autoComplete="off" spellCheck={false} placeholder="e.g. DEMO-001" value={practice.caseReference} onChange={set("caseReference")} maxLength={40} />
      </Field>
      <Field id="case-dueDate" label="Requested completion date" required hint="Your preferred date" error={errors.dueDate}>
        <input {...inputProps("case-dueDate", errors.dueDate)} type="date" min={todayIso()} value={practice.dueDate} onChange={set("dueDate")} />
      </Field>
      <p className="text-sm text-ink-soft sm:col-span-2">
        The requested date is a wish, not a confirmed delivery date: the lab confirms timing after reviewing the case.
      </p>
    </div>
  );
}
