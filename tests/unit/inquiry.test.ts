import { describe, expect, it } from "vitest";
import { coerceInquiry, normalizeWebsite, validateInquiry } from "@/lib/inquiry/schema";

const valid = {
  labName: "TEST Precision Lab",
  companyName: "",
  contactName: "Test Person",
  email: "Test.Person@Example.com",
  phoneCountry: "hu",
  phone: "06 30 123 4567",
  country: "hu",
  region: "",
  city: "Budapest",
  website: "",
  message: "",
};

describe("inquiry validation", () => {
  it("accepts a complete non-US inquiry and normalises it", () => {
    const result = validateInquiry(coerceInquiry(valid));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.email).toBe("test.person@example.com");
    expect(result.data.phoneE164).toBe("+36301234567");
    expect(result.data.phoneDisplay).toBe("+36 30 123 4567");
    expect(result.data.country).toBe("HU");
  });

  it("requires a valid state for US labs", () => {
    const us = { ...valid, country: "US", phoneCountry: "US", phone: "(415) 555-2671" };
    const missing = validateInquiry(coerceInquiry(us));
    expect(missing.ok || missing.errors.region).toMatch(/state/);
    const wrong = validateInquiry(coerceInquiry({ ...us, region: "Texas" }));
    expect(wrong.ok || wrong.errors.region).toMatch(/list/);
    expect(validateInquiry(coerceInquiry({ ...us, region: "TX" })).ok).toBe(true);
  });

  it("gives field-level errors", () => {
    const result = validateInquiry(coerceInquiry({ ...valid, labName: "", email: "nope@", phone: "123", city: "" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(["city", "email", "labName", "phone"]);
    expect(result.errors.phone).toMatch(/\+36/);
  });

  it("checks the optional website and length limits", () => {
    expect(normalizeWebsite("yourlab.com")).toBe("https://yourlab.com/");
    expect(normalizeWebsite("http://www.lab.hu/about")).toBe("http://www.lab.hu/about");
    expect(normalizeWebsite("javascript:alert(1)")).toBeNull();
    expect(normalizeWebsite("not a site")).toBeNull();
    const result = validateInquiry(coerceInquiry({ ...valid, website: "not a site", message: "x".repeat(4001) }));
    expect(result.ok ? {} : Object.keys(result.errors).sort()).toEqual(["message", "website"]);
  });

  it("ignores unknown fields and non-string values", () => {
    const input = coerceInquiry({ ...valid, labName: 42, admin: true });
    expect(input.labName).toBe("");
    expect("admin" in input).toBe(false);
  });
});
