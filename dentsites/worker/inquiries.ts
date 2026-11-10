// Website inquiries from clinic owners: stored and emailed to the Smatch team.

import { coerceInquiry, validateInquiry, type Inquiry } from "../src/lib/inquiry/schema";
import { countryName, oneLine, renderEmail } from "./email";
import { tableSchema, type BaseRecord } from "./store";
import type { Kind } from "./submissions";

export interface InquiryRecord extends BaseRecord {
  clinic_name: string;
  company_name: string | null;
  contact_name: string;
  email: string;
  phone: string;
  phone_display: string;
  phone_country: string;
  country: string;
  region: string | null;
  city: string;
  website: string | null;
  message: string | null;
}

export const inquiryKind: Kind<Inquiry, InquiryRecord> = {
  noun: "inquiry",
  table: "inquiries",
  schema: tableSchema(
    "inquiries",
    [
      "clinic_name TEXT NOT NULL",
      "company_name TEXT",
      "contact_name TEXT NOT NULL",
      "email TEXT NOT NULL",
      "phone TEXT NOT NULL",
      "phone_display TEXT NOT NULL",
      "phone_country TEXT NOT NULL",
      "country TEXT NOT NULL",
      "region TEXT",
      "city TEXT NOT NULL",
      "website TEXT",
      "message TEXT",
    ],
    ["CREATE INDEX IF NOT EXISTS inquiries_email_created ON inquiries (email, created_at)"],
  ),
  recipientsVar: "INQUIRY_NOTIFY_TO",
  recipients: (env) => env.INQUIRY_NOTIFY_TO,
  validate(body) {
    const result = validateInquiry(coerceInquiry(body));
    return result.ok ? result : { ok: false, errors: result.errors as Record<string, string> };
  },
  toRow: (d) => ({
    clinic_name: d.clinicName,
    company_name: d.companyName || null,
    contact_name: d.contactName,
    email: d.email,
    phone: d.phoneE164,
    phone_display: d.phoneDisplay,
    phone_country: d.phoneCountry,
    country: d.country,
    region: d.region || null,
    city: d.city,
    website: d.website || null,
    message: d.message || null,
  }),
  // Same clinic and email within the window: an accidental resubmission.
  duplicateKey: (d) => ({ email: d.email, clinic_name: d.clinicName }),
  dailyLimit: { column: "email", value: (d) => d.email, max: 5, message: "We've already received several inquiries from this email today. We'll be in touch." },
  compose(r, config) {
    const place = [r.city, r.region, countryName(r.country)].filter(Boolean).join(", ");
    const body = renderEmail({
      kicker: "New website quote request",
      heading: r.clinic_name,
      intro: `New website quote request from ${r.source}`,
      rows: [
        ["Clinic name", r.clinic_name],
        ["Company / Legal name", r.company_name ?? "—"],
        ["Contact person", r.contact_name],
        ["Work email", r.email],
        ["Phone number", r.phone_display],
        ["Country", `${countryName(r.country)} (${r.country})`],
        ["State / Region", r.region ?? "—"],
        ["City", r.city],
        ["Current website", r.website ?? "—"],
      ],
      messageLabel: "Message / Requirements",
      message: r.message ?? "—",
      meta: [
        ["Inquiry ID", r.id],
        ["Received", r.created_at],
        ["Source", r.source],
      ],
      footer: `Reply to this email to answer ${r.contact_name} directly.`,
    });
    return { from: config.from, to: config.to, replyTo: r.email, subject: oneLine(`Website inquiry: ${r.clinic_name} (${place})`).slice(0, 200), ...body };
  },
  receipt: (r) => ({ id: r.id }),
  csvColumns: ["id", "created_at", "source", "clinic_name", "company_name", "contact_name", "email", "phone_display", "country", "region", "city", "website", "message", "notification_status", "notification_attempts", "notified_at"],
};
