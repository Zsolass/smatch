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
  labName: string;
  contactName: string;
  email: string;
  phoneCountry: string;
  phone: string;
  country: string;
  region?: string;
  city: string;
  website?: string;
  message?: string;
  companyName?: string;
}

export function testInquiry(overrides: Partial<InquiryData> = {}): InquiryData {
  const id = uid();
  return {
    labName: `E2E TEST Lab ${id}`,
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
  await form.getByLabel("Laboratory name").fill(d.labName);
  if (d.companyName) await form.getByLabel("Company / Legal name").fill(d.companyName);
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
  return (await res.json()).inquiries as Record<string, unknown>[];
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
