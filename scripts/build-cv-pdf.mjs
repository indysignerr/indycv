// Génère public/cv-indy-francois-{fr,en}.pdf depuis la route /cv/ (feuille de style A4).
// Usage : npm run build (dans out/) puis  node scripts/build-cv-pdf.mjs
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";
import path from "node:path";

const OUT = path.resolve("out");
const CHROME = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((p) => p && existsSync(p));
if (!CHROME) throw new Error("Chrome introuvable (définir CHROME_PATH)");

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
const server = createServer(async (req, res) => {
  let p = path.join(OUT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  try {
    if ((await stat(p)).isDirectory()) p = path.join(p, "index.html");
    res.setHeader("Content-Type", types[path.extname(p)] ?? "application/octet-stream");
    res.end(await readFile(p));
  } catch {
    res.statusCode = 404;
    res.end("not found");
  }
}).listen(0);

const port = server.address().port;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
for (const lang of ["fr", "en"]) {
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/cv/?lang=${lang}`, { waitUntil: "networkidle0" });
  await page.evaluateHandle("document.fonts.ready");
  const target = path.resolve("public", `cv-indy-francois-${lang}.pdf`);
  await page.pdf({ path: target, format: "A4", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  console.log("✓", target);
}
await browser.close();
server.close();
