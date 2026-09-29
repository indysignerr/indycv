// Génère le set de favicons + og.png depuis public/logo.svg
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const svg = "public/logo.svg";
const png = (size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();

for (const [name, size] of [["favicon-16x16.png", 16], ["favicon-32x32.png", 32], ["favicon-48x48.png", 48], ["apple-touch-icon.png", 180], ["android-chrome-192x192.png", 192], ["android-chrome-512x512.png", 512]]) {
  await writeFile(`public/${name}`, await png(size));
}

// favicon.ico : conteneur ICO avec un PNG 32x32
const p32 = await png(32);
const head = Buffer.alloc(22);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
head.writeUInt8(32, 6); head.writeUInt8(32, 7); head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12);
head.writeUInt32LE(p32.length, 14); head.writeUInt32LE(22, 18);
await writeFile("public/favicon.ico", Buffer.concat([head, p32]));

await writeFile("public/site.webmanifest", JSON.stringify({
  name: "Indy François", short_name: "Indy", theme_color: "#0B0B10", background_color: "#0B0B10", display: "standalone", start_url: "/",
  icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" }, { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }],
}, null, 2));

// Image Open Graph 1200x630
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><radialGradient id="a" cx="85%" cy="0%" r="70%"><stop offset="0" stop-color="#FF5A36" stop-opacity=".35"/><stop offset="1" stop-color="#FF5A36" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="630" fill="#0B0B10"/><rect width="1200" height="630" fill="url(#a)"/><text x="80" y="120" font-family="Menlo, monospace" font-size="24" letter-spacing="4" fill="#8A8794">MINES PARIS-PSL × ALBERT SCHOOL</text><text x="80" y="330" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="104" letter-spacing="-3" fill="#EDEAE4">Business, data &amp; code.</text><text x="80" y="450" font-family="Georgia, serif" font-style="italic" font-size="96" fill="#FF5A36">Un seul cerveau.</text><text x="80" y="560" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="40" fill="#EDEAE4">Indy François</text><text x="1120" y="560" text-anchor="end" font-family="Menlo, monospace" font-size="26" fill="#8A8794">indyfrancois.com</text></svg>`;
await sharp(Buffer.from(og)).png().toFile("public/og.png");
console.log("✓ favicons + og.png");
