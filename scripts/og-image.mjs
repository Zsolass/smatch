// Renders public/og-image.png (sharing preview) and public/apple-touch-icon.png
// from scripts/og.html. Usage: node scripts/og-image.mjs
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// Playwright is preinstalled globally in the dev container (resolved via NODE_PATH).
const { chromium } = createRequire(import.meta.url)("playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const types = { ".html": "text/html", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2" };

const server = http.createServer(async (req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  try {
    res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" }).end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
await page.goto(`http://127.0.0.1:${server.address().port}/scripts/og.html`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.locator("#og").screenshot({ path: path.join(root, "public/og-image.png") });
await page.locator("#icon").screenshot({ path: path.join(root, "public/apple-touch-icon.png") });
await browser.close();
server.close();
console.log("wrote public/og-image.png and public/apple-touch-icon.png");
