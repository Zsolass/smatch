// Builds the images used in the sales email (public/email/*.jpg) from live
// screenshots of the demo. Start the site first (`npm run preview`), then:
//   node scripts/email-images.mjs [baseUrl]   (default http://127.0.0.1:8787)
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// Playwright is preinstalled globally in the dev container (resolved via NODE_PATH).
const { chromium } = createRequire(import.meta.url)("playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv[2] ?? "http://127.0.0.1:8787";
const outDir = path.join(root, "public/email");
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const shot = async (url, viewport, scale, prepare) => {
  const page = await browser.newPage({ viewport, deviceScaleFactor: scale, isMobile: viewport.width < 500, hasTouch: viewport.width < 500 });
  await page.goto(`${base}${url}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.querySelectorAll("[data-reveal]").forEach((e) => e.classList.add("is-visible")));
  await page.waitForTimeout(900);
  const buffer = prepare ? await prepare(page) : await page.screenshot();
  await page.close();
  return `data:image/png;base64,${buffer.toString("base64")}`;
};

const desktop = await shot("/", { width: 1440, height: 900 }, 1);
const mobile = await shot("/", { width: 390, height: 844 }, 2);
const chart = await shot("/submit-case", { width: 1440, height: 1000 }, 1.5, async (page) => {
  await page.getByRole("button", { name: "Load example case" }).click();
  await page.getByText(/Example case DEMO-001 loaded/).waitFor();
  await page.getByRole("button", { name: /Next: Restoration/ }).click();
  await page.waitForTimeout(800);
  const section = page.locator('section[aria-labelledby="chart-title"]');
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  return section.screenshot();
});

const logo = `data:image/svg+xml;base64,${(await readFile(path.join(root, "public/lab/logo-mark.svg"))).toString("base64")}`;

const page = await browser.newPage({ viewport: { width: 1300, height: 1000 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html><html><head><style>
  * { margin: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; background: #fff; }
  .canvas { position: relative; overflow: hidden; }
  #hero { width: 1200px; height: 740px; background: radial-gradient(55% 65% at 45% 80%, #1d4148 0%, #0e1f23 100%); }
  .window { position: absolute; left: 48px; top: 52px; width: 960px; border-radius: 16px; overflow: hidden; background: #fff;
            box-shadow: 0 30px 80px -20px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.08); }
  .bar { height: 40px; background: #ebe7df; display: flex; align-items: center; gap: 8px; padding: 0 16px; }
  .dot { width: 12px; height: 12px; border-radius: 50%; }
  .url { margin-left: 18px; flex: 1; max-width: 420px; height: 24px; border-radius: 12px; background: #fff; color: #596067;
         font-size: 13px; display: flex; align-items: center; padding: 0 12px; gap: 6px; }
  .window img { display: block; width: 960px; height: 600px; }
  .phone { position: absolute; left: 896px; top: 150px; width: 262px; padding: 10px; border-radius: 40px; background: #0b1416;
           box-shadow: 0 30px 70px -18px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.12); }
  .phone img { display: block; width: 242px; border-radius: 30px; }
  #chart { width: 1200px; padding: 28px 40px 52px; background: #ffffff; }
  #chart .frame { border-radius: 18px; overflow: hidden; box-shadow: 0 24px 60px -24px rgba(16,24,28,.35), 0 0 0 1px #ddd7cc; background: #fff; }
  #chart .frame img { display: block; width: 100%; }
</style></head><body>
  <div id="hero" class="canvas">
    <div class="window">
      <div class="bar">
        <span class="dot" style="background:#e46b5d"></span><span class="dot" style="background:#e9b949"></span><span class="dot" style="background:#5fbf62"></span>
        <span class="url"><img src="${logo}" style="width:14px;height:14px"> labsites.smatch.cloud</span>
      </div>
      <img src="${desktop}" alt="">
    </div>
    <div class="phone"><img src="${mobile}" alt=""></div>
  </div>
  <div id="chart" class="canvas"><div class="frame"><img src="${chart}" alt=""></div></div>
</body></html>`);
await page.waitForTimeout(500);
await page.locator("#hero").screenshot({ path: path.join(outDir, "labsites-hero.jpg"), type: "jpeg", quality: 82 });
await page.locator("#chart").screenshot({ path: path.join(outDir, "case-chart.jpg"), type: "jpeg", quality: 82 });
await browser.close();
console.log("wrote public/email/labsites-hero.jpg and public/email/case-chart.jpg");
