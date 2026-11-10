import { expect, test } from "@playwright/test";
import { clinic, mainLocation } from "../../src/config/clinic";
import { enabledTreatments } from "../../src/config/treatments";
import { collectConsoleErrors, expectNoHorizontalOverflow, recordAnalytics, scrollThrough } from "./helpers";

const WIDTHS = [375, 768, 1440];
const PAGES = ["/", "/treatments", "/treatments/full-arch-implants", "/treatments/emergency-care", "/book", "/get-this-website", "/privacy"];

test.describe("Site quality", () => {
  for (const width of WIDTHS) {
    test(`renders cleanly at ${width}px`, async ({ browser }) => {
      test.setTimeout(180_000);
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const errors = collectConsoleErrors(page);
      for (const path of PAGES) {
        await page.goto(path, { waitUntil: "networkidle" });
        await scrollThrough(page);
        await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete), undefined, { timeout: 15_000 });
        const broken = await page.evaluate(() =>
          Array.from(document.images)
            .filter((img) => !img.complete || img.naturalWidth === 0)
            .map((img) => img.currentSrc || img.src),
        );
        expect(broken, `broken images on ${path}`).toEqual([]);
        await expectNoHorizontalOverflow(page);
        // Nothing stays hidden waiting for a reveal animation.
        await expect(page.locator("[data-reveal]:not(.is-visible)"), `unrevealed content on ${path}`).toHaveCount(0);
        const slug = path === "/" ? "home" : path.slice(1).replace(/\//g, "-");
        await page.screenshot({ path: `test-results/screenshots/${slug}-${width}.png`, fullPage: true });
      }
      expect(errors).toEqual([]);
      await context.close();
    });
  }

  test("is marked noindex and has sharing metadata", async ({ page, request }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Smatch Demo Dental/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
    const og = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(og).toBeTruthy();
    expect((await request.get(new URL(og!).pathname)).status()).toBe(200);
    expect((await request.get("/icon.svg")).status()).toBe(200);
    expect((await request.get("/apple-touch-icon.png")).status()).toBe(200);
    expect((await request.get("/")).headers()["x-robots-tag"]).toMatch(/noindex/);
    // No business details for search engines on the fictional demo.
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  });

  test("every treatment has its own page, title and heading", async ({ page }) => {
    for (const t of enabledTreatments) {
      await page.goto(`/treatments/${t.id}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(t.name);
      await expect(page).toHaveTitle(new RegExp(`${t.seo.title} in ${mainLocation.name}`));
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    }
  });

  test("sample content is labelled as such", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Sample cases: 3D illustrations, not patient photographs")).toBeVisible();
    await expect(page.getByText("Sample review")).toHaveCount(clinic.results.stories.length);
    await expect(page.getByText("Sample rating")).toBeVisible();
    await expect(page.getByText(/Sample fees for demonstration/)).toBeVisible();
    await expect(page.getByRole("contentinfo")).toContainText("Demo website, not a real clinic");
  });

  test("before/after: arrow keys and the Before/After buttons both work", async ({ page }) => {
    await page.goto("/#results");
    const slider = page.getByRole("slider", { name: /Compare before and after: A missing premolar/ });
    await expect(slider).toHaveAttribute("aria-valuetext", "50% before, 50% after");
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveAttribute("aria-valuetext", "52% before, 48% after");
    const views = page.getByRole("group", { name: "Views of A missing premolar" });
    await views.getByRole("button", { name: "After" }).click();
    await expect(slider).toHaveAttribute("aria-valuetext", "0% before, 100% after");
    await expect(views.getByRole("button", { name: "After" })).toHaveAttribute("aria-pressed", "true");
    await views.getByRole("button", { name: "Before" }).click();
    await expect(slider).toHaveAttribute("aria-valuetext", "100% before, 0% after");
    // Another case, with a link to its treatment page.
    await page.getByRole("button", { name: /Crowded front teeth/ }).click();
    await expect(page.getByRole("slider", { name: /Crowded front teeth/ })).toHaveAttribute("aria-valuetext", "50% before, 50% after");
    await page.getByRole("link", { name: "About this treatment" }).click();
    await expect(page).toHaveURL(/\/treatments\/clear-aligners\/?$/);
  });

  test("the treatments menu lists every treatment and closes with Escape", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("banner").getByRole("button", { name: "Treatments" });
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const menu = page.locator("#treatments-menu");
    await expect(menu.getByRole("link")).toHaveCount(enabledTreatments.length + 1);
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(toggle).toBeFocused();
    await toggle.click();
    await menu.getByRole("link", { name: /Full-arch implants/ }).click();
    await expect(page).toHaveURL(/\/treatments\/full-arch-implants\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Full-arch implants");
  });

  test("keyboard: the skip link comes first, and the fees table can be scrolled", async ({ page }) => {
    await page.goto("/treatments/full-arch-implants");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await expect(page.getByRole("region", { name: "The options side by side" })).toHaveAttribute("tabindex", "0");
  });

  test("call links use the clinic's phone number, and clicks are reported without personal data", async ({ page }) => {
    const events = await recordAnalytics(page);
    await page.goto("/");
    const calls = page.locator('a[href^="tel:"]');
    expect(await calls.count()).toBeGreaterThan(3);
    for (const href of await calls.evaluateAll((els) => els.map((a) => a.getAttribute("href")))) expect(href).toBe(mainLocation.phoneHref);
    // Keep the page in place for the call link: only the reporting is under test.
    await page.evaluate(() => document.addEventListener("click", (e) => (e.target as Element).closest("a[href^='tel:']") && e.preventDefault(), true));
    await page.getByRole("banner").getByRole("link", { name: `Call ${mainLocation.phone}` }).click();
    await page.getByRole("banner").getByRole("link", { name: "Book a consultation" }).click();
    await expect(page).toHaveURL(/\/book\/?$/);
    // Each event says what happened and where: nothing else.
    expect(await events()).toEqual([
      { event: "call_click", placement: "header" },
      { event: "booking_click", placement: "header" },
    ]);
  });

  test("mobile: menu, and a call/book bar that steps aside for the form", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto("/");
    const bar = page.locator("[data-action-bar]");
    await expect(bar).toBeInViewport();
    await expect(bar.getByRole("link", { name: "Book a consultation" })).toBeVisible();
    await expect(bar.getByRole("link", { name: `Call ${mainLocation.phone}` })).toHaveAttribute("href", mainLocation.phoneHref);

    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("navigation", { name: "Mobile" });
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "Costs & Financing" }).click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/#costs$/);
    await expect(page.getByRole("heading", { name: /Clear fees/ })).toBeInViewport();

    // At the form, the bar leaves the screen so it never covers the submit button.
    await page.locator("form[data-consultation-form]").scrollIntoViewIfNeeded();
    await expect(bar).not.toBeInViewport();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(bar).toBeInViewport();

    // Touch targets in the bar are comfortably large.
    for (const link of await bar.getByRole("link").all()) expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await bar.getByRole("link", { name: "Book a consultation" }).click();
    await expect(page).toHaveURL(/\/book\/?$/);
    await context.close();
  });

  test("reduced motion: content is visible without animations", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    const opacity = await page.locator("#costs [data-reveal]").first().evaluate((el) => getComputedStyle(el).opacity);
    expect(opacity).toBe("1");
    await context.close();
  });

  test("unknown pages and treatments show the 404 page", async ({ request }) => {
    for (const path of ["/does-not-exist", "/treatments/does-not-exist"]) {
      const res = await request.get(path);
      expect(res.status()).toBe(404);
      expect(await res.text()).toContain("This page doesn");
    }
  });
});
