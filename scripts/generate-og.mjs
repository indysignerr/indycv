// Génère public/og.png (1200×630), l'image d'aperçu affichée quand on partage le site (LinkedIn, messageries…).
// Polices du site (Bricolage Grotesque, Instrument Serif italique, Geist Mono), rendu par Chrome.
// Usage : node scripts/generate-og.mjs
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const CHROME = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => p && existsSync(p));
if (!CHROME) throw new Error("Chrome introuvable (définir CHROME_PATH)");

const font = async (pkg, file) => `data:font/woff2;base64,${(await readFile(path.resolve("node_modules/@fontsource", pkg, "files", file))).toString("base64")}`;
const display = await font("bricolage-grotesque", "bricolage-grotesque-latin-800-normal.woff2");
const serif = await font("instrument-serif", "instrument-serif-latin-400-italic.woff2");
const mono = await font("geist-mono", "geist-mono-latin-500-normal.woff2");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: D; src: url(${display}) format("woff2"); font-weight: 800; }
@font-face { font-family: S; src: url(${serif}) format("woff2"); font-style: italic; }
@font-face { font-family: M; src: url(${mono}) format("woff2"); font-weight: 500; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; background: #0B0B10; color: #EDEAE4; font-family: D; }
.bg { position: absolute; inset: 0; background:
  radial-gradient(700px 480px at 92% 0%, rgba(255, 90, 54, 0.30), transparent 70%),
  radial-gradient(600px 420px at 0% 100%, rgba(120, 100, 220, 0.14), transparent 70%); }
.wrap { position: absolute; inset: 0; padding: 84px 80px 70px; display: flex; flex-direction: column; }
.label { font-family: M; font-size: 24px; letter-spacing: 0.2em; color: #8A8794; text-transform: uppercase; }
.title { margin-top: auto; font-size: 92px; white-space: nowrap; font-weight: 800; line-height: 1; letter-spacing: -0.02em; }
.name { margin-top: 10px; font-family: S; font-style: italic; font-size: 100px; line-height: 1.05; color: #FF5A36; }
.foot { margin-top: auto; display: flex; justify-content: space-between; align-items: baseline; }
.role { font-size: 30px; font-weight: 800; letter-spacing: -0.01em; }
.url { font-family: M; font-size: 24px; color: #8A8794; }
</style></head><body><div class="bg"></div><div class="wrap">
  <p class="label">Mines Paris-PSL × Albert School</p>
  <p class="title">Business, data &amp; code.</p>
  <p class="name">Indy François</p>
  <div class="foot"><p class="role">Bachelor Business &amp; Data · Indysigner</p><p class="url">indyfrancois.com</p></div>
</div></body></html>`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "load" });
await page.evaluateHandle("document.fonts.ready");
const target = path.resolve("public", "og.png");
await page.screenshot({ path: target, type: "png" });
await browser.close();
console.log("✓", target);
