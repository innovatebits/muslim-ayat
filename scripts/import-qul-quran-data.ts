import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildQulCorpus, type QuranSource } from "@muslim-ayat/quran-data";

const sourcePath = resolve("packages/quran-data/src/data/source/uthmani-simple.json");
const corpusPath = resolve("packages/quran-data/src/data/quran.json");

try {
  const sourceBytes = await readFile(sourcePath);
  const sourceChecksum = createHash("sha256").update(sourceBytes).digest("hex");
  const sourceMetadata: QuranSource = {
    source: "Quranic Universal Library (QUL)",
    edition: "Uthmani Simple (Ayah by Ayah, Hafs, Me-Quran), resource 82",
    license: null,
    rightsStatus: "unknown",
    url: "https://qul.tarteel.ai/resources/quran-script/82",
    sha256: sourceChecksum,
    verifiedAt: "2026-11-24T20:34:27.044Z",
  };
  const corpus = buildQulCorpus(JSON.parse(sourceBytes.toString("utf8")) as unknown, sourceMetadata);

  await writeFile(corpusPath, `${JSON.stringify(corpus, null, 2)}\n`, "utf8");
  console.log(`Imported ${corpus.surahs.length} QUL surahs and 6,236 ayahs to ${corpusPath}.`);
  console.log(`Source checksum: ${sourceChecksum}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unable to import the QUL Quran export.");
  process.exitCode = 1;
}