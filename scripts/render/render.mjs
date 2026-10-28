// Renders the procedural images in a headless browser.
// Usage: node scripts/render/render.mjs [shot ...]   (all shots when omitted)
import http from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// Playwright is preinstalled globally in the dev container (resolved via NODE_PATH).
const { chromium } = createRequire(import.meta.url)("playwright");

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const outDir = path.join(here, "out");
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript" };

const server = http.createServer(async (req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const { port } = server.address();

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage();
page.on("console", (m) => console.log(`[page] ${m.text()}`));
page.on("pageerror", (e) => console.error(`[page error] ${e.message}`));
await page.goto(`http://127.0.0.1:${port}/scripts/render/scene.html`);
await page.waitForFunction(() => window.ready === true);
const all = await page.evaluate(() => window.shotNames);
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : all;
await mkdir(outDir, { recursive: true });
for (const name of wanted) {
  const t0 = Date.now();
  const dataUrl = await page.evaluate((n) => window.renderShot(n), name);
  await writeFile(path.join(outDir, `${name}.png`), Buffer.from(dataUrl.split(",")[1], "base64"));
  console.log(`${name}: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
await browser.close();
server.close();
