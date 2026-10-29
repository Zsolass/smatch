import { expect, test } from "@playwright/test";
import { siteConfig } from "../../src/config/site";
import { E2E } from "../../playwright.config";
import { adminInquiries, failNextEmails, fillInquiry, sentEmails, testInquiry, useUniqueIp } from "./helpers";

const SUCCESS = "Thank you! Your inquiry has been received. We’ll be in touch.";

async function expectFormBelowHeader(page: import("@playwright/test").Page) {
  const heading = page.getByRole("heading", { name: "Inquire", exact: true });
  await expect(heading).toBeInViewport();
  const header = await page.locator("header").first().boundingBox();
  const box = await heading.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(header!.y + header!.height - 1);
  await expect(page.locator("#inquire form").getByLabel("Laboratory name")).toBeInViewport();
}

test.describe("Inquire form", () => {
  test("header button opens the form; a non-US inquiry is stored and emailed", async ({ page, request }) => {
    await useUniqueIp(page);
    await page.goto("/");
    await page.getByRole("banner").getByRole("link", { name: "Inquire" }).click();
    await expect(page).toHaveURL(/#inquire$/);
    await expectFormBelowHeader(page);

    const data = testInquiry({ companyName: "E2E Test Kft.", website: "e2e-lab.example", region: "Pest" });
    await fillInquiry(page, data);
    const posted = page.waitForRequest((r) => r.url().endsWith("/api/inquiries") && r.method() === "POST");
    await page.getByRole("button", { name: "Request a quote" }).click();
    const req = await posted;
    expect(req.postDataJSON()).toMatchObject({ labName: data.labName, email: data.email, country: "HU" });
    await expect(page.getByText(SUCCESS)).toBeVisible();

    const record = (await adminInquiries(request)).find((r) => r.email === data.email)!;
    expect(record).toMatchObject({
      source: siteConfig.domain,
      lab_name: data.labName,
      company_name: "E2E Test Kft.",
      contact_name: data.contactName,
      phone: "+36301234567",
      country: "HU",
      region: "Pest",
      city: "Budapest",
      website: "https://e2e-lab.example/",
    });
    expect(Date.parse(String(record.created_at))).toBeGreaterThan(Date.now() - 5 * 60_000);

    await expect.poll(async () => (await sentEmails(request)).filter((e) => String(e.body.subject).includes(data.labName)).length).toBe(1);
    const email = (await sentEmails(request)).find((e) => String(e.body.subject).includes(data.labName))!;
    expect(email.body).toMatchObject({ to: [E2E.notifyTo], reply_to: data.email, subject: `Website inquiry: ${data.labName} (Budapest, Pest, Hungary)` });
    for (const value of [data.contactName, "+36 30 123 4567", "E2E Test Kft.", "https://e2e-lab.example/", data.message!]) {
      expect(String(email.body.text)).toContain(value);
    }
    await expect.poll(async () => (await adminInquiries(request)).find((r) => r.email === data.email)!.notification_status).toBe("sent");
  });

  test("shows field-level errors and doesn't send an incomplete form", async ({ page }) => {
    await useUniqueIp(page);
    let posts = 0;
    page.on("request", (r) => r.url().endsWith("/api/inquiries") && r.method() === "POST" && posts++);
    await page.goto("/");
    await page.locator("#hero-title").scrollIntoViewIfNeeded();
    await page.getByRole("complementary", { name: "For dental lab owners" }).getByRole("link", { name: "Inquire" }).click();
    await expectFormBelowHeader(page);

    const form = page.locator("#inquire form");
    await page.getByRole("button", { name: "Request a quote" }).click();
    await expect(form.getByRole("alert")).toContainText("Please correct the highlighted fields.");
    for (const msg of ["Enter your laboratory's name.", "Enter the contact person's full name.", "Enter your work email.", "Choose your country.", "Enter your city."]) {
      await expect(form.getByText(msg).last()).toBeVisible();
    }
    await expect(form.getByLabel("Laboratory name")).toHaveAttribute("aria-invalid", "true");

    await fillInquiry(page, testInquiry({ email: "not-an-email", phone: "123" }));
    await expect(form.locator("#" + (await form.getByLabel("Work email").getAttribute("id")) + "-error")).toHaveText(/valid email address/);
    await expect(form.getByText(/Enter a valid phone number for \+36/).last()).toBeVisible();
    expect(posts).toBe(0);
  });

  test("US labs must choose a state; the closing section opens the same form", async ({ page, request }) => {
    await useUniqueIp(page);
    await page.goto("/");
    await page.getByRole("heading", { name: /Want a website like this/ }).scrollIntoViewIfNeeded();
    await page.locator("section[aria-labelledby=closing-title]").getByRole("link", { name: "Inquire" }).click();
    await expectFormBelowHeader(page);

    const data = testInquiry({ country: "US", phoneCountry: "US", phone: "(415) 555-2671", city: "San Francisco" });
    await fillInquiry(page, data);
    const form = page.locator("#inquire form");
    await expect(form.getByLabel(/^State/)).toHaveJSProperty("tagName", "SELECT");
    await page.getByRole("button", { name: "Request a quote" }).click();
    await expect(form.getByText("Choose your state.").last()).toBeVisible();
    await form.getByLabel(/^State/).selectOption("CA");
    await page.getByRole("button", { name: "Request a quote" }).click();
    await expect(page.getByText(SUCCESS)).toBeVisible();
    const record = (await adminInquiries(request)).find((r) => r.email === data.email)!;
    expect(record).toMatchObject({ country: "US", region: "CA", phone: "+14155552671" });
  });

  test("/#inquire from another page lands on the form", async ({ page }) => {
    await page.goto("/privacy");
    await page.getByRole("contentinfo").getByRole("link", { name: /Inquire about a website/ }).click();
    await expect(page).toHaveURL(/\/#inquire$/);
    await expectFormBelowHeader(page);
    await page.goto("/submit-case");
    await page.goto("/#inquire");
    await expectFormBelowHeader(page);
  });

  test("mobile: Inquire is visible without opening the menu and the form works", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await useUniqueIp(page);
    await page.goto("/");
    const inquire = page.getByRole("banner").getByRole("link", { name: "Inquire" });
    await expect(inquire).toBeVisible();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
    await inquire.click();
    await expectFormBelowHeader(page);
    const data = testInquiry({ country: "DE", phoneCountry: "DE", phone: "030 901820", city: "Berlin" });
    await fillInquiry(page, data);
    await page.getByRole("button", { name: "Request a quote" }).click();
    await expect(page.getByText(SUCCESS)).toBeVisible();
    await context.close();
  });

  test("a double click or retried request creates one inquiry", async ({ page, request }) => {
    await useUniqueIp(page);
    let posts = 0;
    page.on("request", (r) => r.url().endsWith("/api/inquiries") && r.method() === "POST" && posts++);
    await page.goto("/#inquire");
    const data = testInquiry();
    await fillInquiry(page, data);
    const button = page.getByRole("button", { name: "Request a quote" });
    await button.dblclick();
    await expect(page.getByText(SUCCESS)).toBeVisible();
    expect(posts).toBe(1);

    // Same idempotency key sent twice (e.g. a network retry).
    const payload = { ...testInquiry(), idempotencyKey: crypto.randomUUID(), hp: "", elapsedMs: 9000 };
    const headers = { "CF-Connecting-IP": "10.250.1.1", Origin: E2E.baseURL };
    const first = await request.post("/api/inquiries", { data: payload, headers });
    const second = await request.post("/api/inquiries", { data: payload, headers });
    expect(first.status()).toBe(201);
    expect(second.status()).toBe(200);
    expect(await second.json()).toMatchObject({ duplicate: true, id: (await first.json()).id });
    // Same lab and email again with a new key within minutes: also not duplicated.
    const third = await request.post("/api/inquiries", { data: { ...payload, idempotencyKey: crypto.randomUUID() }, headers });
    expect(await third.json()).toMatchObject({ duplicate: true });

    const all = await adminInquiries(request);
    expect(all.filter((r) => r.email === data.email)).toHaveLength(1);
    expect(all.filter((r) => r.email === payload.email)).toHaveLength(1);
  });

  test("a save error keeps the details and can be retried", async ({ page }) => {
    await useUniqueIp(page);
    await page.goto("/#inquire");
    const data = testInquiry();
    await fillInquiry(page, data);
    await page.route("**/api/inquiries", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ ok: false, error: "storage_failed", message: "We couldn't save your inquiry. Your details are still in the form; please try again." }) }),
    );
    await page.getByRole("button", { name: "Request a quote" }).click();
    await expect(page.locator("#inquire").getByRole("alert")).toContainText("We couldn't save your inquiry");
    await expect(page.getByText(SUCCESS)).toHaveCount(0);
    await expect(page.locator("#inquire form").getByLabel("Laboratory name")).toHaveValue(data.labName);
    await page.unroute("**/api/inquiries");
    await page.getByRole("button", { name: "Request a quote" }).click();
    await expect(page.getByText(SUCCESS)).toBeVisible();
  });

  test("an unconfigured endpoint is reported, not faked", async ({ page }) => {
    await page.goto("/#inquire");
    await fillInquiry(page, testInquiry());
    await page.route("**/api/inquiries", (route) => route.fulfill({ status: 404, contentType: "text/html", body: "<h1>Not found</h1>" }));
    await page.getByRole("button", { name: "Request a quote" }).click();
    await expect(page.locator("#inquire").getByRole("alert")).toContainText("isn't set up on this deployment");
    await expect(page.getByText(SUCCESS)).toHaveCount(0);
  });

  test("an email outage doesn't lose the inquiry; the cron retry sends it", async ({ page, request }) => {
    test.slow();
    await useUniqueIp(page);
    await failNextEmails(request, 3);
    await page.goto("/#inquire");
    const data = testInquiry();
    await fillInquiry(page, data);
    await page.getByRole("button", { name: "Request a quote" }).click();
    await expect(page.getByText(SUCCESS)).toBeVisible();

    const find = async () => (await adminInquiries(request)).find((r) => r.email === data.email)!;
    await expect.poll(async () => (await find()).notification_attempts, { timeout: 20_000 }).toBe(3);
    expect(await find()).toMatchObject({ notification_status: "pending", notification_error: expect.stringContaining("503") });

    // Rows younger than a minute are left to their first delivery attempt.
    await page.waitForTimeout(62_000);
    const retry = await request.post("/api/inquiries/retry-notifications", { headers: { Authorization: `Bearer ${E2E.adminToken}` } });
    expect(await retry.json()).toMatchObject({ ok: true, sent: expect.any(Number) });
    await expect.poll(async () => (await find()).notification_status, { timeout: 15_000 }).toBe("sent");
    const emails = (await sentEmails(request)).filter((e) => String(e.body.subject).includes(data.labName));
    expect(emails).toHaveLength(1);
  });
});
