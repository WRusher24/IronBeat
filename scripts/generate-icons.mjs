// Generates the PWA / iOS home-screen icons from one vector source.
// Run with: npm run icons
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const BG = "#1C1C1E";
const AMBER = "#D4A373";
const CREAM = "#F5F2EC";

/**
 * Full-bleed square artwork (no transparency, no rounded corners – iOS applies its own mask and
 * would otherwise paint transparent corners black). The glyph occupies the central ~61% so it
 * stays fully visible under iOS rounding and Android maskable cropping.
 */
const artwork = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BG}"/>
  <rect x="172" y="247" width="168" height="18" rx="9" fill="${CREAM}"/>
  <rect x="100" y="161" width="32" height="190" rx="10" fill="${AMBER}"/>
  <rect x="140" y="191" width="32" height="130" rx="10" fill="${AMBER}"/>
  <rect x="340" y="191" width="32" height="130" rx="10" fill="${AMBER}"/>
  <rect x="380" y="161" width="32" height="190" rx="10" fill="${AMBER}"/>
</svg>`;

const logoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="80 140 352 232">
  <g>
    <rect x="172" y="247" width="168" height="18" rx="9" fill="currentColor"/>
    <rect x="100" y="161" width="32" height="190" rx="10" fill="currentColor"/>
    <rect x="140" y="191" width="32" height="130" rx="10" fill="currentColor"/>
    <rect x="340" y="191" width="32" height="130" rx="10" fill="currentColor"/>
    <rect x="380" y="161" width="32" height="190" rx="10" fill="currentColor"/>
  </g>
</svg>`;

mkdirSync("public/icons", { recursive: true });

const outputs = [
  ["apple-touch-icon.png", 180],
  ["apple-touch-icon-167.png", 167],
  ["apple-touch-icon-152.png", 152],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["icon-maskable-512.png", 512],
  ["favicon-32.png", 32],
];

for (const [name, size] of outputs) {
  await sharp(Buffer.from(artwork(512)))
    .resize(size, size)
    .flatten({ background: BG }) // guarantees an opaque image
    .png({ compressionLevel: 9 })
    .toFile(`public/icons/${name}`);
  console.log(`public/icons/${name}`);
}

writeFileSync("public/icons/logo-mark.svg", logoSvg.trim());
console.log("public/icons/logo-mark.svg");
