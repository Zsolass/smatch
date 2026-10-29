import { describe, expect, it } from "vitest";
import type { InquiryRecord } from "../../worker/db";
import { composeEmail } from "../../worker/notify";

describe("notification email", () => {
  const record: InquiryRecord = {
    id: "inq-1",
    idempotency_key: "k",
    created_at: "2026-10-28T10:00:00.000Z",
    source: "labsites.smatch.cloud",
    lab_name: "TEST <Lab> & Co",
    company_name: null,
    contact_name: "Test Person",
    email: "test@example.com",
    phone: "+36301234567",
    phone_display: "+36 30 123 4567",
    phone_country: "HU",
    country: "HU",
    region: null,
    city: "Budapest",
    website: "https://lab.example/",
    message: "Line one\r\nBcc: someone@example.com",
    notification_status: "pending",
    notification_attempts: 0,
    notification_error: null,
    notified_at: null,
  };

  it("names the lab in the subject and replies to the contact", () => {
    const email = composeEmail(record, { from: "Smatch Test <test-sender@example.com>", to: ["inquiries-test@example.com"] });
    expect(email.subject).toBe("Website inquiry: TEST <Lab> & Co (Budapest, Hungary)");
    expect(email.replyTo).toBe("test@example.com");
    expect(email.to).toEqual(["inquiries-test@example.com"]);
    for (const value of ["Test Person", "+36 30 123 4567", "Hungary (HU)", "https://lab.example/", "labsites.smatch.cloud", "inq-1"]) {
      expect(email.text).toContain(value);
    }
  });

  it("escapes HTML and keeps the subject on one line", () => {
    const email = composeEmail({ ...record, lab_name: "Evil\r\nBcc: x@example.com <script>" }, { from: "a@example.com", to: ["b@example.com"] });
    expect(email.subject).not.toMatch(/[\r\n]/);
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
