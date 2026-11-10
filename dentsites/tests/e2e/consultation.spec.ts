import { expect, test } from "@playwright/test";
import { consultationForm, recordAnalytics } from "./helpers";

const PATIENT = { name: "Test Patient", phone: "(415) 555-2671" };

test.describe("Consultation request (demo mode)", () => {
  test("a patient need leads to the treatment page, and booking from there keeps the treatment", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /missing one tooth/ }).click();
    await expect(page).toHaveURL(/\/treatments\/dental-implants\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Dental implants");

    // The form at the end of the treatment page already has the treatment selected.
    await expect(consultationForm(page).treatment).toHaveValue("dental-implants");

    await page.locator("#treatment-title").scrollIntoViewIfNeeded();
    await page.getByRole("main").getByRole("link", { name: "Book a consultation" }).first().click();
    await expect(page).toHaveURL(/\/book\/?\?treatment=dental-implants$/);
    await expect(consultationForm(page).treatment).toHaveValue("dental-implants");
    await expect(consultationForm(page).treatment.locator("option:checked")).toHaveText("Dental implants");
  });

  test("the header button opens the form with no treatment chosen, and an unknown one is ignored", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("banner").getByRole("link", { name: "Book a consultation" }).click();
    await expect(page).toHaveURL(/\/book\/?$/);
    await expect(page.getByRole("heading", { level: 1, name: "Book a consultation" })).toBeVisible();
    await expect(consultationForm(page).treatment).toHaveValue("");
    await page.goto("/book?treatment=not-a-treatment");
    await expect(consultationForm(page).treatment).toHaveValue("");
  });

  test("missing and invalid details are explained field by field, and nothing is sent", async ({ page }) => {
    await page.goto("/book");
    const f = consultationForm(page);
    await f.submit.click();
    await expect(f.alert).toContainText("Please correct the highlighted fields.");
    await expect(f.alert).toBeFocused();
    await expect(f.form.getByText("Enter your full name.").last()).toBeVisible();
    await expect(f.form.getByText("Enter a phone number.").last()).toBeVisible();
    await expect(f.name).toHaveAttribute("aria-invalid", "true");

    await f.name.fill(PATIENT.name);
    await f.phone.fill("123");
    await f.email.fill("not-an-email");
    await expect(f.form.getByText(/Enter a valid phone number for \+1/).last()).toBeVisible();
    await expect(f.form.getByText(/Enter a valid email address/).last()).toBeVisible();

    // Asking for a reply by email makes the email address required.
    await f.email.fill("");
    await f.form.getByRole("radio", { name: "Email" }).check();
    await f.submit.click();
    await expect(f.form.getByText(/so we can reply by email/).last()).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
    // What was typed is still there.
    await expect(f.name).toHaveValue(PATIENT.name);
  });

  test("a valid request shows a loading state, then a clearly labelled demo confirmation; nothing leaves the browser", async ({ page }) => {
    // Anything that could carry the patient's details: a request with a body, an API call, or the details in a URL.
    const requests: string[] = [];
    page.on("request", (r) => {
      if (r.postData() !== null || r.url().includes("/api/") || /Test(%20|\+| )Patient|555-2671|5552671/.test(decodeURIComponent(r.url()))) requests.push(`${r.method()} ${r.url()}`);
    });
    const events = await recordAnalytics(page);
    await page.goto("/book?treatment=veneers");
    const f = consultationForm(page);
    await expect(f.form).toContainText("Demo form.");
    await f.name.fill(PATIENT.name);
    await f.phone.fill(PATIENT.phone);
    await f.form.getByRole("radio", { name: "Text message" }).check();
    await f.message.fill("Automated test request, please ignore.");

    // A double click must not send the request twice.
    await f.submit.dblclick();
    await expect(f.form.getByRole("button", { name: "Sending…" })).toBeDisabled();

    const done = page.getByRole("status");
    await expect(done).toContainText("Request received (demo)");
    await expect(done).toContainText("nothing was sent, and no appointment has been booked");
    await expect(done).toContainText(/Reference: DEMO-[A-Z0-9]{6}/);
    await expect(done).toBeFocused();

    expect(requests).toEqual([]);
    // One success, reported without the patient's details.
    const reported = await events();
    expect(reported).toEqual([{ event: "consultation_request", placement: "book-page", treatment: "veneers", mode: "demo" }]);
    expect(JSON.stringify(reported)).not.toMatch(/Test Patient|555|Automated/);

    // Starting again keeps the treatment and clears the rest.
    await done.getByRole("button", { name: "Send another request" }).click();
    await expect(consultationForm(page).name).toHaveValue("");
    await expect(consultationForm(page).treatment).toHaveValue("veneers");
  });

  test("when sending fails, the error is shown and the details are kept for another try", async ({ page, context }) => {
    await page.goto("/book");
    const f = consultationForm(page);
    await f.name.fill(PATIENT.name);
    await f.phone.fill(PATIENT.phone);
    await f.email.fill("patient@example.com");
    await f.treatment.selectOption("clear-aligners");

    await context.setOffline(true);
    await f.submit.click();
    await expect(f.alert).toContainText("We couldn't reach the server");
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(f.name).toHaveValue(PATIENT.name);
    await expect(f.phone).toHaveValue(PATIENT.phone);
    await expect(f.email).toHaveValue("patient@example.com");
    await expect(f.treatment).toHaveValue("clear-aligners");
    await expect(f.submit).toBeEnabled();

    await context.setOffline(false);
    await f.submit.click();
    await expect(page.getByRole("status")).toContainText("Request received (demo)");
  });

  test("the form on the homepage works on a phone", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto("/#contact");
    const f = consultationForm(page);
    await f.name.fill(PATIENT.name);
    await f.phone.fill(PATIENT.phone);
    await f.treatment.selectOption({ label: "Emergency dental care" });
    await f.submit.scrollIntoViewIfNeeded();
    // Nothing fixed to the screen sits on top of the submit button.
    const box = (await f.submit.boundingBox())!;
    const onTop = await page.evaluate(([x, y]) => document.elementFromPoint(x!, y!)?.closest("button")?.textContent ?? "", [box.x + box.width / 2, box.y + box.height / 2]);
    expect(onTop).toContain("Request my consultation");
    await f.submit.tap();
    await expect(page.getByRole("status")).toContainText("Request received (demo)");
    await context.close();
  });

  test("the demo's server refuses consultation requests", async ({ request }) => {
    const res = await request.post("/api/consultation-requests", {
      data: { fullName: "Test Patient", phoneCountry: "US", phone: "(415) 555-2671", idempotencyKey: "0f9c8a52-6a3e-4c55-9d0e-444444444444", hp: "", elapsedMs: 9000 },
    });
    expect(res.status()).toBe(403);
    expect(await res.json()).toMatchObject({ ok: false, error: "disabled" });
    expect(await (await request.get("/api/health")).json()).toMatchObject({ consultationRequests: { enabled: false } });
  });
});
