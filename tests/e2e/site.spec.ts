import { expect, test } from "@playwright/test";
import { collectConsoleErrors, expectNoHorizontalOverflow } from "./helpers";

const WIDTHS = [375, 768, 1440, 1920];
const PAGES = ["/", "/submit-case", "/privacy"];

test.describe("Site quality", () => {
  for (const width of WIDTHS) {
    test(`renders cleanly at ${width}px`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const errors = collectConsoleErrors(page);
      for (const path of PAGES) {
        await page.goto(path, { waitUntil: "networkidle" });
        // Scroll through so lazy images load and reveal animations run.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 500) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 80));
          }
        });
        await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete), undefined, { timeout: 15_000 });
        const broken = await page.evaluate(() =>
          Array.from(document.images)
            .filter((img) => !img.complete || img.naturalWidth === 0)
            .map((img) => img.currentSrc || img.src),
        );
        expect(broken, `broken images on ${path}`).toEqual([]);
        await expectNoHorizontalOverflow(page);
        const slug = path === "/" ? "home" : path.slice(1);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: `test-results/screenshots/${slug}-${width}.png`, fullPage: true });
      }
      expect(errors).toEqual([]);
      await context.close();
    });
  }

  test("is marked noindex and has sharing metadata", async ({ page, request }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Smatch Demo Lab/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
    const og = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(og).toBeTruthy();
    expect((await request.get(new URL(og!).pathname)).status()).toBe(200);
    expect((await request.get("/icon.svg")).status()).toBe(200);
    expect((await request.get("/apple-touch-icon.png")).status()).toBe(200);
    const res = await request.get("/");
    expect(res.headers()["x-robots-tag"]).toMatch(/noindex/);
  });

  test("gallery lightbox: open, browse with arrow keys, close with Escape", async ({ page }) => {
    await page.goto("/#work");
    await page.getByRole("button", { name: /Enlarge sample case: Three-unit bridge/ }).click();
    const dialog = page.getByRole("dialog", { name: "Three-unit bridge" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Sample case");
    await expect(dialog).toContainText("1 / 6");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("dialog", { name: "Implant crown" })).toContainText("2 / 6");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("mobile menu opens, navigates and closes", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 760 } });
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("navigation", { name: "Mobile" });
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "Digital Workflow" }).click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/#workflow$/);
    await expect(page.getByRole("heading", { name: /From scan to delivery/ })).toBeInViewport();
    await context.close();
  });

  test("unknown pages show the 404 page", async ({ request }) => {
    const res = await request.get("/does-not-exist");
    expect(res.status()).toBe(404);
    expect(await res.text()).toContain("This page doesn");
  });
});
