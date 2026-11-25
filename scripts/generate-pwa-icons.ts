import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const sourcePath = resolve("apps/web/public/icons/icon.svg");
const svg = await readFile(sourcePath);
const squareBackgroundSvg = Buffer.from(
  svg.toString("utf8").replace(' rx="112"', ""),
  "utf8",
);

for (const size of [192, 512]) {
  const outputPath = resolve(`apps/web/public/icons/icon-${size}.png`);
  await mkdir(dirname(outputPath), { recursive: true });
  const result = await sharp(svg)
    .resize(size, size, { fit: "fill" })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
  if (result.width !== size || result.height !== size) {
    throw new Error(`Generated ${outputPath} at an unexpected size.`);
  }
  console.log(`Generated ${outputPath} (${result.width}x${result.height}).`);
}

const maskablePath = resolve("apps/web/public/icons/icon-512-maskable.png");
const maskableResult = await sharp(squareBackgroundSvg)
  .resize(512, 512, { fit: "fill" })
  .png({ compressionLevel: 9 })
  .toFile(maskablePath);
if (maskableResult.width !== 512 || maskableResult.height !== 512) {
  throw new Error(`Generated ${maskablePath} at an unexpected size.`);
}
console.log(`Generated ${maskablePath} (${maskableResult.width}x${maskableResult.height}).`);