// Generates the source images @capacitor/assets needs to produce iOS app icons
// and splash screens. Run: `node scripts/gen_native_assets.mjs`, then after
// `npx cap add ios`, run `npm run cap:assets` to emit the platform assets.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const INK = { r: 17, g: 17, b: 16, alpha: 1 }; // #111110
const SRC = "public/icon-512.png"; // lime field + ink "lines" logomark (opaque)

await mkdir("assets", { recursive: true });

// App icon — exact 2× upscale keeps the flat logomark crisp; opaque (iOS rule).
await sharp(SRC)
  .resize(1024, 1024, { kernel: "nearest" })
  .flatten({ background: INK })
  .png()
  .toFile("assets/icon-only.png");

// Splash — the icon centred on an ink field (2732×2732). Light + dark identical.
const logo = await sharp(SRC).resize(760, 760).png().toBuffer();
for (const name of ["splash.png", "splash-dark.png"]) {
  await sharp({ create: { width: 2732, height: 2732, channels: 4, background: INK } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(`assets/${name}`);
}

console.log("✓ assets/icon-only.png (1024), assets/splash.png + splash-dark.png (2732)");
