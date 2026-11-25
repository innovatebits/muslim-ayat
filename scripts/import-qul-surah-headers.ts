import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { strFromU8, unzipSync } from "fflate";
import {
  preserveQuranSourceRights,
  QuranSourceSchema,
  UNKNOWN_QURAN_RIGHTS_REVIEW,
} from "@muslim-ayat/quran-data";

const [archiveArgument] = process.argv.slice(2);
const sourcePath = resolve("packages/quran-data/src/data/source/surah-name-header-svg.zip");
const metadataPath = resolve("packages/quran-data/src/data/surah-header-source.json");
const outputDirectory = resolve("apps/web/public/surah-headers");
const expectedNames = Array.from({ length: 113 }, (_, index) => {
  return `surah-${String(index + 2).padStart(3, "0")}.svg`;
});

try {
  const archiveBytes = archiveArgument
    ? await readFile(resolve(archiveArgument))
    : await readFile(sourcePath);
  const entries = unzipSync(archiveBytes);
  const entryNames = Object.keys(entries);

  if (
    entryNames.length !== expectedNames.length ||
    expectedNames.some((name) => !entries[name]) ||
    entryNames.some((name) => !expectedNames.includes(name))
  ) {
    throw new Error("Expected exactly one QUL SVG for each Surah from 2 through 114.");
  }

  for (const name of expectedNames) {
    const svg = strFromU8(entries[name]!);
    if (
      !/<svg\b/u.test(svg) ||
      !svg.includes("Naveed Ahmad, Muath Ahmed Ibn-Hassan") ||
      !svg.includes("CC BY 4.0") ||
      /<(?:script|foreignObject)\b|\son[a-z]+\s*=|(?:href|xlink:href)\s*=\s*["'](?:https?:|\/\/|javascript:|data:)/iu.test(
        svg,
      )
    ) {
      throw new Error(`Unsafe or invalid SVG in QUL archive: ${name}`);
    }
  }

  const previousSource = QuranSourceSchema.parse(
    JSON.parse(await readFile(metadataPath, "utf8")) as unknown,
  );
  const source = preserveQuranSourceRights(
    QuranSourceSchema.parse({
      source: "Quranic Universal Library (QUL)",
      edition: "Surah name header SVG collection, resource 592; 113 files for Surahs 2–114",
      attributionNote:
        'The SVG files credit Naveed Ahmad and Muath Ahmed Ibn-Hassan and state "CC BY 4.0". QUL’s resource page says copyright information is unavailable, so rights remain unknown pending confirmation.',
      license: null,
      url: "https://qul.tarteel.ai/resources/font/surah-name-header-svg",
      sha256: createHash("sha256").update(archiveBytes).digest("hex"),
      verifiedAt: new Date().toISOString(),
      rightsReview: UNKNOWN_QURAN_RIGHTS_REVIEW,
    }),
    previousSource,
  );

  await mkdir(dirname(sourcePath), { recursive: true });
  await mkdir(outputDirectory, { recursive: true });
  if (archiveArgument) await writeFile(sourcePath, archiveBytes);
  await writeFile(metadataPath, `${JSON.stringify(source, null, 2)}\n`, "utf8");
  await Promise.all(
    expectedNames.map((name) => writeFile(resolve(outputDirectory, name), entries[name]!)),
  );

  console.log(`Imported ${expectedNames.length} QUL Surah header SVGs to ${outputDirectory}.`);
  console.log(`Source archive checksum: ${source.sha256}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unable to import QUL Surah header images.");
  process.exitCode = 1;
}