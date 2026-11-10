// Consultation requests from patients, for a live clinic site: stored and
// emailed to the clinic. The demo keeps this endpoint switched off
// (CONSULTATION_REQUESTS is not "on"), so no patient details are ever accepted.

import { consultationOptions, CONTACT_METHOD_LABELS, locationLabel, treatmentLabel } from "../src/lib/consultation/options";
import { coerceConsultation, validateConsultation, type ConsultationRequest } from "../src/lib/consultation/schema";
import { oneLine, renderEmail } from "./email";
import { tableSchema, type BaseRecord } from "./store";
import type { Kind } from "./submissions";

export interface ConsultationRecord extends BaseRecord {
  full_name: string;
  phone: string;
  phone_display: string;
  phone_country: string;
  email: string | null;
  treatment: string | null;
  location: string | null;
  contact_method: string | null;
  message: string | null;
}

/** A short reference a patient can quote on the phone. */
export const referenceOf = (id: string) => `REQ-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

export const consultationKind: Kind<ConsultationRequest, ConsultationRecord> = {
  noun: "request",
  table: "consultation_requests",
  schema: tableSchema(
    "consultation_requests",
    ["full_name TEXT NOT NULL", "phone TEXT NOT NULL", "phone_display TEXT NOT NULL", "phone_country TEXT NOT NULL", "email TEXT", "treatment TEXT", "location TEXT", "contact_method TEXT", "message TEXT"],
    ["CREATE INDEX IF NOT EXISTS consultation_requests_phone_created ON consultation_requests (phone, created_at)"],
  ),
  recipientsVar: "CONSULTATION_NOTIFY_TO",
  recipients: (env) => env.CONSULTATION_NOTIFY_TO,
  validate(body) {
    const result = validateConsultation(coerceConsultation(body), consultationOptions());
    return result.ok ? result : { ok: false, errors: result.errors as Record<string, string> };
  },
  toRow: (d) => ({
    full_name: d.fullName,
    phone: d.phoneE164,
    phone_display: d.phoneDisplay,
    phone_country: d.phoneCountry,
    email: d.email || null,
    treatment: d.treatment || null,
    location: d.location || null,
    contact_method: d.contactMethod || null,
    message: d.message || null,
  }),
  // The same person asking about the same thing within the window.
  duplicateKey: (d) => ({ phone: d.phoneE164, full_name: d.fullName }),
  dailyLimit: { column: "phone", value: (d) => d.phoneE164, max: 5, message: "We've already received several requests from this number today. We'll be in touch." },
  compose(r, config) {
    const treatment = (r.treatment && treatmentLabel(r.treatment)) || "Not sure yet";
    const body = renderEmail({
      kicker: "New consultation request",
      heading: r.full_name,
      intro: `New consultation request from ${r.source}`,
      rows: [
        ["Full name", r.full_name],
        ["Phone number", r.phone_display],
        ["Email", r.email ?? "—"],
        ["Preferred contact", (r.contact_method && CONTACT_METHOD_LABELS[r.contact_method]) || "—"],
        ["Treatment interest", treatment],
        ["Clinic location", (r.location && locationLabel(r.location)) || "—"],
      ],
      messageLabel: "Message",
      message: r.message ?? "—",
      meta: [
        ["Reference", referenceOf(r.id)],
        ["Received", r.created_at],
        ["Source", r.source],
      ],
      footer: "This is a request, not a booking: contact the patient to agree a time.",
    });
    return { from: config.from, to: config.to, replyTo: r.email ?? undefined, subject: oneLine(`Consultation request: ${r.full_name} (${treatment})`).slice(0, 200), ...body };
  },
  receipt: (r) => ({ reference: referenceOf(r.id) }),
  csvColumns: ["id", "created_at", "source", "full_name", "phone_display", "email", "contact_method", "treatment", "location", "message", "notification_status", "notification_attempts", "notified_at"],
};
