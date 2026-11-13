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
  const phone = viewport.width < 500;
  const page = await browser.newPage({ viewport, deviceScaleFactor: scale, isMobile: phone, hasTouch: phone, reducedMotion: "reduce" });
  await page.goto(`${base}${url}`, { waitUntil: "networkidle" });
  await page.evaluate((isPhone) => {
    document.querySelectorAll("[data-reveal]").forEach((e) => e.classList.add("is-visible"));
    // The call/book bar belongs in the phone pictures only.
    if (!isPhone) document.querySelectorAll("[data-action-bar]").forEach((e) => e.remove());
  }, phone);
  await page.waitForTimeout(900);
  const buffer = prepare ? await prepare(page) : await page.screenshot();
  await page.close();
  return `data:image/png;base64,${buffer.toString("base64")}`;
};
// Brings an element to the top of the screen, just below the sticky header.
const scrollTo = (page, selector, offset = 90) =>
  page.evaluate(([sel, off]) => window.scrollTo({ top: document.querySelector(sel).getBoundingClientRect().top + scrollY - off, behavior: "instant" }), [selector, offset]);

const desktop = await shot("/", { width: 1440, height: 900 }, 1);
const mobile = await shot("/", { width: 390, height: 844 }, 2);

// A before/after case, with the divider in the middle.
const results = await shot("/", { width: 760, height: 1000 }, 1.5, async (page) => {
  await page.getByRole("button", { name: /Several failing upper teeth/ }).click();
  await page.waitForTimeout(700);
  const block = page.locator("#results .min-w-0").first();
  await block.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  return block.screenshot();
});

// A treatment page: the options, and when each one is chosen.
const treatment = await shot("/treatments/full-arch-implants", { width: 760, height: 1000 }, 1.5, async (page) => {
  const block = page.getByRole("heading", { name: "Ways to replace a full arch" }).locator("..");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  // The heading and the first row of option cards.
  const box = await block.boundingBox();
  const row = await block.locator("li").nth(1).boundingBox();
  return page.screenshot({ fullPage: true, clip: { x: box.x, y: box.y, width: box.width, height: row.y + row.height - box.y + 6 } });
});

// Two phone screens: choosing by need, and the consultation request.
const needs = await shot("/", { width: 390, height: 844 }, 2, async (page) => {
  await scrollTo(page, "#treatments-title");
  await page.waitForTimeout(500);
  return page.screenshot();
});
const booking = await shot("/book?treatment=dental-implants", { width: 390, height: 844 }, 2, async (page) => {
  const form = page.locator("form[data-consultation-form]");
  await form.getByLabel("Full name").fill("Alex Morgan");
  await form.getByLabel("Phone number").fill("(415) 555-2671");
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await scrollTo(page, "form[data-consultation-form]", 84);
  await page.waitForTimeout(500);
  return page.screenshot();
});

const logo = `data:image/svg+xml;base64,${(await readFile(path.join(root, "public/clinic/logo-mark.svg"))).toString("base64")}`;

const page = await browser.newPage({ viewport: { width: 1300, height: 1000 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html><html><head><style>
  * { margin: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; background: #fff; }
  .canvas { position: relative; overflow: hidden; }
  .blob { position: absolute; border-radius: 50%; filter: blur(60px); }
  #hero { width: 1200px; height: 740px; background: radial-gradient(60% 70% at 40% 85%, #2c6a56 0%, #13241f 100%); }
  .window { position: absolute; left: 48px; top: 52px; width: 960px; border-radius: 16px; overflow: hidden; background: #fff;
            box-shadow: 0 30px 80px -20px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.08); }
  .bar { height: 40px; background: #ede5d6; display: flex; align-items: center; gap: 8px; padding: 0 16px; }
  .dot { width: 12px; height: 12px; border-radius: 50%; }
  .url { margin-left: 18px; flex: 1; max-width: 420px; height: 24px; border-radius: 12px; background: #fff; color: #5b625f;
         font-size: 13px; display: flex; align-items: center; padding: 0 12px; gap: 6px; }
  .window > img { display: block; width: 960px; height: 600px; }
  .phone { position: absolute; padding: 10px; border-radius: 40px; background: #0c1613;
           box-shadow: 0 30px 70px -18px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.12); }
  .phone img { display: block; width: 100%; border-radius: 30px; }
  #hero .phone { left: 896px; top: 150px; width: 262px; }
  .framed { width: 1008px; }
  .framed .frame { border-radius: 22px; overflow: hidden; }
  .framed .frame img { display: block; width: 100%; }
  #results { padding: 40px 44px 44px; background: #13241f; }
  #treatment { padding: 14px 16px 40px; background: #ffffff; }
  #treatment .frame { padding: 34px 36px 38px; background: #f7f2e8; box-shadow: 0 0 0 1px #dcd3c2; }
  #phones { width: 1008px; height: 800px; background: #dcf26e; }
  #phones .phone { width: 318px; }
</style></head><body>
  <div id="hero" class="canvas">
    <div class="blob" style="left:820px;top:-140px;width:420px;height:420px;background:#dcf26e;opacity:.35"></div>
    <div class="window">
      <div class="bar">
        <span class="dot" style="background:#f47c5c"></span><span class="dot" style="background:#e9b949"></span><span class="dot" style="background:#5fbf62"></span>
        <span class="url"><img src="${logo}" style="width:14px;height:14px"> dentsites.smatch.cloud</span>
      </div>
      <img src="${desktop}" alt="">
    </div>
    <div class="phone"><img src="${mobile}" alt=""></div>
  </div>
  <div id="results" class="canvas framed"><div class="frame"><img src="${results}" alt=""></div></div>
  <div id="treatment" class="canvas framed"><div class="frame"><img src="${treatment}" alt=""></div></div>
  <div id="phones" class="canvas">
    <div class="blob" style="left:-120px;top:420px;width:460px;height:460px;background:#f47c5c;opacity:.55"></div>
    <div class="blob" style="left:700px;top:-160px;width:420px;height:420px;background:#ffffff;opacity:.7"></div>
    <div class="phone" style="left:150px;top:70px;transform:rotate(-4deg)"><img src="${needs}" alt=""></div>
    <div class="phone" style="left:540px;top:120px;transform:rotate(3deg)"><img src="${booking}" alt=""></div>
  </div>
</body></html>`);
await page.waitForTimeout(600);
const save = (id, name) => page.locator(id).screenshot({ path: path.join(outDir, name), type: "jpeg", quality: 82 });
await save("#hero", "dentsites-hero.jpg");
await save("#results", "before-after.jpg");
await save("#treatment", "treatment-options.jpg");
await save("#phones", "booking-phone.jpg");
await browser.close();
console.log("wrote public/email/dentsites-hero.jpg, before-after.jpg, treatment-options.jpg and booking-phone.jpg");
