import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { E2E } from "../../playwright.config";

/** Unique, clearly marked test data per run. */
export const runId = Date.now().toString(36);
let counter = 0;
export const uid = () => `${runId}-${++counter}`;

/** Each test sends inquiries from its own IP so rate limits don't interfere. */
export async function useUniqueIp(page: Page) {
  const ip = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}`;
  await page.setExtraHTTPHeaders({ "CF-Connecting-IP": ip });
  return ip;
}

export interface InquiryData {
  clinicName: string;
  contactName: string;
  email: string;
  phoneCountry: string;
  phone: string;
  country: string;
  region?: string;
  city: string;
  website?: string;
  message?: string;
}

export function testInquiry(overrides: Partial<InquiryData> = {}): InquiryData {
  const id = uid();
  return {
    clinicName: `E2E TEST Dental ${id}`,
    contactName: "Test Person",
    email: `e2e-${id}@example.com`,
    phoneCountry: "HU",
    phone: "06 30 123 4567",
    country: "HU",
    city: "Budapest",
    message: "Automated test inquiry, please ignore.",
    ...overrides,
  };
}

export async function fillInquiry(page: Page, d: InquiryData) {
  const form = page.locator("#inquire form");
  await form.getByLabel("Clinic name").fill(d.clinicName);
  await form.getByLabel("Contact person").fill(d.contactName);
  await form.getByLabel("Work email").fill(d.email);
  await form.getByLabel(/^Country/).selectOption(d.country);
  await form.getByLabel("Phone country code").selectOption(d.phoneCountry);
  await form.getByLabel("Phone number").fill(d.phone);
  if (d.region) {
    const region = form.getByLabel(/^State/);
    if ((await region.evaluate((el) => el.tagName)) === "SELECT") await region.selectOption(d.region);
    else await region.fill(d.region);
  }
  await form.getByLabel("City").fill(d.city);
  if (d.website) await form.getByLabel("Current website").fill(d.website);
  if (d.message) await form.getByLabel("Message / Requirements").fill(d.message);
  // The endpoint rejects forms sent within 2.5 s of the page loading (a simple bot check).
  await page.waitForTimeout(2600);
}

export async function adminInquiries(request: APIRequestContext) {
  const res = await request.get(`${E2E.baseURL}/api/inquiries?limit=200`, { headers: { Authorization: `Bearer ${E2E.adminToken}` } });
  expect(res.status()).toBe(200);
  return (await res.json()).items as Record<string, unknown>[];
}

export async function sentEmails(request: APIRequestContext) {
  const res = await request.get(`${E2E.mockEmail}/__emails`);
  return (await res.json()) as { body: Record<string, unknown>; idempotencyKey: string }[];
}

export async function failNextEmails(request: APIRequestContext, count: number) {
  await request.post(`${E2E.mockEmail}/__fail?count=${count}`);
}

/** True when the page can't scroll sideways. */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

export function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

/** Scrolls through the page so lazy images load and reveal animations run. */
export async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
}

/** Records the analytics events the page reports (see src/lib/analytics.ts). */
export async function recordAnalytics(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __events: unknown[] };
    w.__events = [];
    window.addEventListener("clinic:analytics", (e) => w.__events.push((e as CustomEvent).detail));
  });
  return () => page.evaluate(() => (window as unknown as { __events: Record<string, string>[] }).__events);
}

/** The consultation request form and its fields. */
export function consultationForm(page: Page) {
  const form = page.locator("form[data-consultation-form]");
  return {
    form,
    name: form.getByLabel("Full name"),
    phone: form.getByLabel("Phone number"),
    email: form.getByLabel("Email", { exact: false }).and(form.locator("input[type=email]")),
    treatment: form.getByLabel("Treatment interest"),
    message: form.getByLabel("Short message"),
    submit: form.getByRole("button", { name: /Request my consultation|Sending/ }),
    alert: form.getByRole("alert"),
  };
}
