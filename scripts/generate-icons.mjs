/**
 * Generates every raster icon from one vector design.
 *
 *  - apple-touch-icon.png / icon-*.png / maskable-512.png are FULL-BLEED opaque squares.
 *    iOS and Android apply their own rounded mask, so any baked-in corners or transparency
 *    would show up as ugly black/white borders on the home screen.
 *  - The artwork is kept inside the central ~60% so it survives every mask shape without clipping.
 *  - favicon-32.png / icon.svg use rounded corners because browsers draw them as-is.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

const glyph = `
  <g fill="#D4A373">
    <rect x="104" y="196" width="40" height="120" rx="14"/>
    <rect x="150" y="164" width="40" height="184" rx="14"/>
    <rect x="322" y="164" width="40" height="184" rx="14"/>
    <rect x="368" y="196" width="40" height="120" rx="14"/>
  </g>
  <rect x="190" y="244" width="132" height="24" rx="12" fill="#F5F2EC"/>`;

const bg = `<rect width="512" height="512" fill="#1C1C1E"/>
  <circle cx="256" cy="256" r="230" fill="#26262A"/>`;

const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg}${glyph}</svg>`;
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#1C1C1E"/><circle cx="256" cy="256" r="230" fill="#26262A"/>${glyph}</svg>`;

await mkdir(out, { recursive: true });

const png = (svg, size, file) =>
  sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .flatten({ background: "#1C1C1E" }) // guarantees no alpha channel
    .png({ compressionLevel: 9 })
    .toFile(path.join(out, file));

await Promise.all([
  png(square, 180, "apple-touch-icon.png"),
  png(square, 192, "icon-192.png"),
  png(square, 512, "icon-512.png"),
  png(square, 512, "maskable-512.png"),
  sharp(Buffer.from(rounded), { density: 384 }).resize(32, 32).png().toFile(path.join(out, "favicon-32.png")),
  writeFile(path.join(out, "icon.svg"), rounded),
]);

console.log("Icons written to", out);
