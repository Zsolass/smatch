import { describe, expect, it, vi } from "vitest";
import { createDemoAdapter, createHttpAdapter } from "@/lib/consultation/adapter";
import { consultationOptions } from "@/lib/consultation/options";
import { coerceConsultation, validateConsultation, type ConsultationOptions } from "@/lib/consultation/schema";

const options: ConsultationOptions = { treatments: ["dental-implants", "veneers"], locations: ["main"], contactMethods: ["call", "text", "email"] };

const valid = {
  fullName: "  Test Patient ",
  phoneCountry: "us",
  phone: "(415) 555-2671",
  email: "",
  treatment: "dental-implants",
  location: "main",
  contactMethod: "call",
  message: "",
};

describe("consultation request validation", () => {
  it("accepts a short request and normalises the phone number", () => {
    const result = validateConsultation(coerceConsultation(valid), options);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.fullName).toBe("Test Patient");
    expect(result.data.phoneE164).toBe("+14155552671");
    expect(result.data.phoneDisplay).toBe("+1 415 555 2671");
  });

  it("requires a name and a valid phone number; email stays optional", () => {
    const result = validateConsultation(coerceConsultation({ ...valid, fullName: "", phone: "123" }), options);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.fullName).toMatch(/full name/);
    expect(result.errors.phone).toMatch(/valid phone number for \+1/);
    expect(result.errors.email).toBeUndefined();
  });

  it("checks an email address when one is given, and requires it for replies by email", () => {
    const bad = validateConsultation(coerceConsultation({ ...valid, email: "nope" }), options);
    expect(!bad.ok && bad.errors.email).toMatch(/valid email/);
    const missing = validateConsultation(coerceConsultation({ ...valid, contactMethod: "email" }), options);
    expect(!missing.ok && missing.errors.email).toMatch(/reply by email/);
    expect(validateConsultation(coerceConsultation({ ...valid, contactMethod: "email", email: "Pat@Example.com" }), options).ok).toBe(true);
  });

  it("only accepts treatments, locations and contact methods the clinic offers", () => {
    const result = validateConsultation(coerceConsultation({ ...valid, treatment: "teleportation", location: "moon", contactMethod: "fax" }), options);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(["contactMethod", "location", "treatment"]);
    expect(validateConsultation(coerceConsultation({ ...valid, treatment: "" }), options).ok).toBe(true);
  });

  it("asks for the clinic only when there are several locations", () => {
    const multi = { ...options, locations: ["north", "south"] };
    const missing = validateConsultation(coerceConsultation({ ...valid, location: "" }), multi);
    expect(!missing.ok && missing.errors.location).toMatch(/Choose the clinic/);
    expect(validateConsultation(coerceConsultation({ ...valid, location: "south" }), multi).ok).toBe(true);
    expect(validateConsultation(coerceConsultation({ ...valid, location: "" }), options).ok).toBe(true);
  });

  it("limits field lengths and ignores non-string input", () => {
    const result = validateConsultation(coerceConsultation({ ...valid, message: "x".repeat(1001), email: 42 }), options);
    expect(!result.ok && result.errors.message).toMatch(/under 1000/);
  });

  it("builds its options from the clinic configuration", () => {
    const fromConfig = consultationOptions();
    expect(fromConfig.treatments.length).toBeGreaterThan(0);
    expect(fromConfig.locations.length).toBeGreaterThan(0);
  });
});

const meta = { idempotencyKey: "0f9c8a52-6a3e-4c55-9d0e-111111111111", hp: "", elapsedMs: 9000 };
const input = coerceConsultation(valid);
const respond = (status: number, body: unknown, type = "application/json") => new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: { "Content-Type": type } });

describe("consultation adapters", () => {
  it("demo: makes up a reference locally and returns the same one for a repeated submission", async () => {
    const adapter = createDemoAdapter(0);
    const first = await adapter.submit(input, meta);
    const again = await adapter.submit(input, meta);
    const other = await adapter.submit(input, { ...meta, idempotencyKey: "another-key-1234567890" });
    expect(adapter.kind).toBe("demo");
    expect(first).toMatchObject({ ok: true, reference: expect.stringMatching(/^DEMO-[A-Z0-9]{6}$/) });
    expect(again).toEqual(first);
    expect(other).not.toEqual(first);
  });

  it("live: posts the request and succeeds only on the server's acknowledgement", async () => {
    const fetcher = vi.fn(async () => respond(201, { ok: true, reference: "REQ-12345678" }));
    const result = await createHttpAdapter("/api/consultation-requests", fetcher as unknown as typeof fetch).submit(input, meta);
    expect(result).toEqual({ ok: true, reference: "REQ-12345678" });
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/consultation-requests");
    expect(JSON.parse(String(init.body))).toMatchObject({ fullName: "Test Patient", phone: "(415) 555-2671", idempotencyKey: meta.idempotencyKey, elapsedMs: 9000 });
  });

  it("live: a 200 without the acknowledgement is not a success", async () => {
    const adapter = createHttpAdapter("/x", (async () => respond(200, { hello: "world" })) as unknown as typeof fetch);
    expect((await adapter.submit(input, meta)).ok).toBe(false);
  });

  it("live: passes on field errors and server messages", async () => {
    const adapter = createHttpAdapter("/x", (async () => respond(400, { ok: false, error: "validation", message: "Some fields need attention.", fieldErrors: { phone: "Enter a phone number." } })) as unknown as typeof fetch);
    expect(await adapter.submit(input, meta)).toEqual({ ok: false, message: "Some fields need attention.", fieldErrors: { phone: "Enter a phone number." } });
  });

  it("live: reports a missing endpoint and a dropped connection without claiming success", async () => {
    const html = createHttpAdapter("/x", (async () => respond(404, "<html>Not found</html>", "text/html")) as unknown as typeof fetch);
    const noApi = await html.submit(input, meta);
    expect(noApi.ok).toBe(false);
    expect(!noApi.ok && noApi.message).toMatch(/was not sent/);
    const offline = createHttpAdapter("/x", (async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch);
    const dropped = await offline.submit(input, meta);
    expect(!dropped.ok && dropped.message).toMatch(/couldn't reach the server/);
  });
});
