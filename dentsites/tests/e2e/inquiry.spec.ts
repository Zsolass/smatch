import { expect, test } from "@playwright/test";
import { siteConfig } from "../../src/config/site";
import { E2E } from "../../playwright.config";
import { adminInquiries, failNextEmails, fillInquiry, sentEmails, testInquiry, useUniqueIp } from "./helpers";

const SUCCESS = siteConfig.inquiry.successMessage;

test.describe("Clinic-owner journey: Inquire", () => {
  test("the demo banner leads to the owner page; an inquiry is stored and emailed", async ({ page, request }) => {
    await useUniqueIp(page);
    await page.goto("/");
    await page.getByRole("link", { name: /Get a website like this/ }).first().click();
    await expect(page).toHaveURL(/\/get-this-website\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("for your clinic");
    // The owner page has no patient call/book bar.
    await expect(page.locator("[data-action-bar]")).toHaveCount(0);

    const data = testInquiry({ website: "e2e-clinic.example", region: "Pest" });
    await fillInquiry(page, data);
    const posted = page.waitForRequest((r) => r.url().endsWith("/api/inquiries") && r.method() === "POST");
    await page.getByRole("button", { name: "Request a quote" }).click();
    expect((await posted).postDataJSON()).toMatchObject({ clinicName: data.clinicName, email: data.email, country: "HU" });
    await expect(page.getByText(SUCCESS)).toBeVisible();

    const record = (await adminInquiries(request)).find((r) => r.email === data.email)!;
    expect(record).toMatchObject({
      source: siteConfig.domain,
      clinic_name: data.clinicName,
      contact_name: data.contactName,
      phone: "+36301234567",
      country: "HU",
      region: "Pest",
      city: "Budapest",
      website: "https://e2e-clinic.example/",
    });

    await expect.poll(async () => (await sentEmails(request)).filter((e) => String(e.body.subject).includes(data.clinicName)).length).toBe(1);
    const email = (await sentEmails(request)).find((e) => String(e.body.subject).includes(data.clinicName))!;
    expect(email.body).toMatchObject({ to: [E2E.notifyTo], reply_to: data.email, subject: `Website inquiry: ${data.clinicName} (Budapest, Pest, Hungary)` });
    for (const value of [data.contactName, "+36 30 123 4567", "https://e2e-clinic.example/", data.message!]) expect(String(email.body.text)).toContain(value);
    await expect.poll(async () => (await adminInquiries(request)).find((r) => r.email === data.email)!.notification_status).toBe("sent");
  });

  test("shows field-level errors and doesn't send an incomplete form; US clinics choose a state", async ({ page, request }) => {
    await useUniqueIp(page);
    let posts = 0;
    page.on("request", (r) => r.url().endsWith("/api/inquiries") && r.method() === "POST" && posts++);
    await page.goto("/get-this-website");
    const form = page.locator("#inquire form");
    await page.getByRole("button", { name: "Request a quote" }).click();
    await expect(form.getByRole("alert")).toContainText("Please correct the highlighted fields.");
    for (const msg of ["Enter your clinic's name.", "Enter the contact person's full name.", "Enter your work email.", "Choose your country.", "Enter your city."]) {
      await expect(form.getByText(msg).last()).toBeVisible();
    }
    expect(posts).toBe(0);

    const data = testInquiry({ country: "US", phoneCountry: "US", phone: "(415) 555-2671", city: "San Francisco" });
    await fillInquiry(page, data);
    await page.getByRole("button", { name: "Request a quote" }).click();
    await expect(form.getByText("Choose your state.").last()).toBeVisible();
    await form.getByLabel(/^State/).selectOption("CA");
    await page.getByRole("button", { name: "Request a quote" }).click();
    await expect(page.getByText(SUCCESS)).toBeVisible();
    expect((await adminInquiries(request)).find((r) => r.email === data.email)).toMatchObject({ country: "US", region: "CA", phone: "+14155552671" });
  });

  test("a double click stores one inquiry, and an email outage is retried", async ({ page, request }) => {
    await useUniqueIp(page);
    await page.goto("/get-this-website");
    const data = testInquiry();
    await fillInquiry(page, data);
    await failNextEmails(request, 3);
    await page.getByRole("button", { name: "Request a quote" }).dblclick();
    await expect(page.getByText(SUCCESS)).toBeVisible();
    expect((await adminInquiries(request)).filter((r) => r.email === data.email)).toHaveLength(1);

    // The inquiry is safe while the email API is down, and goes out on a later attempt.
    await expect.poll(async () => (await adminInquiries(request)).find((r) => r.email === data.email)!.notification_attempts, { timeout: 30_000 }).toBeGreaterThanOrEqual(3);
    expect((await sentEmails(request)).filter((e) => String(e.body.subject).includes(data.clinicName))).toHaveLength(0);
    await expect
      .poll(
        async () => {
          await request.post(`${E2E.baseURL}/api/retry-notifications`, { headers: { Authorization: `Bearer ${E2E.adminToken}` } });
          return (await adminInquiries(request)).find((r) => r.email === data.email)!.notification_status;
        },
        { timeout: 90_000, intervals: [5_000] },
      )
      .toBe("sent");
    expect((await sentEmails(request)).filter((e) => String(e.body.subject).includes(data.clinicName))).toHaveLength(1);
  });

  test("when the endpoint is unavailable the form says so and keeps the details", async ({ page }) => {
    await useUniqueIp(page);
    await page.route("**/api/inquiries", (route) => route.fulfill({ status: 404, contentType: "text/html", body: "<html>Not found</html>" }));
    await page.goto("/get-this-website");
    const data = testInquiry();
    await fillInquiry(page, data);
    await page.getByRole("button", { name: "Request a quote" }).click();
    const form = page.locator("#inquire form");
    await expect(form.getByRole("alert")).toContainText("isn't set up on this deployment yet");
    await expect(form.getByLabel("Clinic name")).toHaveValue(data.clinicName);
    await expect(page.getByText(SUCCESS)).toHaveCount(0);
  });
});

test.describe("Inquire is within reach on the patient pages", () => {
  for (const width of [375, 1440]) {
    test(`header button, banner and closing call-out at ${width}px`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 800 } });
      const page = await context.newPage();
      for (const path of ["/", "/treatments", "/treatments/dental-implants", "/privacy"]) {
        await page.goto(path);
        // Beside "Book a consultation" in the header, without opening the menu.
        const header = page.getByRole("banner").getByRole("link", { name: "Inquire", exact: true });
        await expect(header, path).toBeVisible();
        await expect(header).toHaveAttribute("href", /\/get-this-website\/?$/);
        await expect(page.getByRole("link", { name: /Get a website like this/ }).first()).toBeVisible();
        await expect(page.getByRole("heading", { name: /Run a dental clinic/ })).toBeVisible();
      }
      await page.goto("/");
      await expect(page.getByRole("complementary", { name: "For clinic owners" }).getByRole("link", { name: "Inquire" })).toBeVisible();
      await page.getByRole("banner").getByRole("link", { name: "Inquire", exact: true }).click();
      await expect(page).toHaveURL(/\/get-this-website\/?$/);
      await expect(page.locator("#inquire form")).toBeVisible();
      await context.close();
    });
  }
});
