import { describe, expect, it } from "vitest";
import { consultationKind, referenceOf, type ConsultationRecord } from "../../worker/consultations";
import { missingConfigMessage } from "../../worker/email";
import type { Env } from "../../worker/env";
import { inquiryKind, type InquiryRecord } from "../../worker/inquiries";

const base = { idempotency_key: "k", created_at: "2026-11-10T10:00:00.000Z", source: "dentsites.smatch.cloud", notification_status: "pending" as const, notification_attempts: 0, notification_error: null, notified_at: null };
const config = { from: "Smatch Dentsite <dentsite@notify.smatch.cloud>", to: ["office@smatch.cloud"] };

describe("website inquiry email", () => {
  const record: InquiryRecord = {
    ...base,
    id: "inq-1",
    clinic_name: "TEST <Dental> & Co",
    company_name: null,
    contact_name: "Test Person",
    email: "test@example.com",
    phone: "+36301234567",
    phone_display: "+36 30 123 4567",
    phone_country: "HU",
    country: "HU",
    region: null,
    city: "Budapest",
    website: "https://clinic.example/",
    message: "Line one\r\nBcc: someone@example.com",
  };

  it("names the clinic in the subject and replies to the contact", () => {
    const email = inquiryKind.compose(record, config);
    expect(email.subject).toBe("Website inquiry: TEST <Dental> & Co (Budapest, Hungary)");
    expect(email.replyTo).toBe("test@example.com");
    expect(email.to).toEqual(["office@smatch.cloud"]);
    expect(email.text).toContain("Clinic name: TEST <Dental> & Co");
    expect(email.text).toContain("Source: dentsites.smatch.cloud");
  });

  it("escapes HTML and keeps the subject on one line", () => {
    const email = inquiryKind.compose({ ...record, clinic_name: "Evil\r\nBcc: x@example.com <script>" }, config);
    expect(email.subject).not.toMatch(/[\r\n]/);
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).not.toContain("<script>");
  });
});

describe("consultation request email", () => {
  const record: ConsultationRecord = {
    ...base,
    id: "0f9c8a52-6a3e-4c55-9d0e-111111111111",
    full_name: "Test <b>Patient</b>",
    phone: "+14155552671",
    phone_display: "+1 415 555 2671",
    phone_country: "US",
    email: null,
    treatment: "full-arch-implants",
    location: null,
    contact_method: "text",
    message: null,
  };

  it("tells the clinic who to contact, how, and about what", () => {
    const email = consultationKind.compose(record, config);
    expect(email.subject).toBe("Consultation request: Test <b>Patient</b> (Full-arch implants)");
    expect(email.replyTo).toBeUndefined();
    expect(email.text).toContain("Preferred contact: Text message");
    expect(email.text).toContain(`Reference: ${referenceOf(record.id)}`);
    expect(email.text).toContain("This is a request, not a booking");
    expect(email.html).toContain("Test &lt;b&gt;Patient&lt;/b&gt;");
  });

  it("gives a short reference", () => {
    expect(referenceOf(record.id)).toBe("REQ-0F9C8A52");
  });
});

describe("missing email settings", () => {
  it("names only what is missing", () => {
    expect(missingConfigMessage({} as Env, undefined, "INQUIRY_NOTIFY_TO")).toBe("Notifications are not configured: set RESEND_API_KEY, INQUIRY_NOTIFY_FROM and INQUIRY_NOTIFY_TO.");
    expect(missingConfigMessage({ RESEND_API_KEY: "k", INQUIRY_NOTIFY_FROM: "a@b.c" } as Env, "", "CONSULTATION_NOTIFY_TO")).toBe("Notifications are not configured: set CONSULTATION_NOTIFY_TO.");
  });
});
