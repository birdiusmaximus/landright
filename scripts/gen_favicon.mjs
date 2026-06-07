// Regenerate app/favicon.ico from the lime logomark (public/icon-512.png) so the
// browser tab icon matches the app/PWA icon. Packs 16/32/48 px PNGs into an ICO
// (PNG-compressed entries, supported by all modern browsers).
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const SRC = "public/icon-512.png";
const OUT = "app/favicon.ico";
const sizes = [16, 32, 48];

const pngs = await Promise.all(
  // ensureAlpha → RGBA PNGs (Next's ICO decoder rejects RGB-only PNG entries).
  sizes.map((s) => sharp(SRC).resize(s, s, { fit: "cover" }).ensureAlpha().png().toBuffer()),
);

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: 1 = icon
header.writeUInt16LE(sizes.length, 4); // image count

const entries = [];
let offset = 6 + sizes.length * 16;
sizes.forEach((s, i) => {
  const png = pngs[i];
  const e = Buffer.alloc(16);
  e.writeUInt8(s >= 256 ? 0 : s, 0); // width  (0 = 256)
  e.writeUInt8(s >= 256 ? 0 : s, 1); // height
  e.writeUInt8(0, 2); // palette colours
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // colour planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(png.length, 8); // size of image data
  e.writeUInt32LE(offset, 12); // offset of image data
  offset += png.length;
  entries.push(e);
});

writeFileSync(OUT, Buffer.concat([header, ...entries, ...pngs]));
console.log(`✓ Wrote ${OUT} (${sizes.join(", ")} px) from ${SRC}`);
