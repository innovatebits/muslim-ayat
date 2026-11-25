import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sourceChecksumMatches, validateQuranCorpus } from "@muslim-ayat/quran-data";
import { getJuzIndex } from "@muslim-ayat/quran-data/juz";

const [corpusArgument, sourceArgument] = process.argv.slice(2);
const corpusPath = resolve(corpusArgument ?? "packages/quran-data/src/data/quran.json");
const sourcePath = resolve(sourceArgument ?? "packages/quran-data/src/data/source/uthmani-simple.json");

try {
  const corpusBytes = await readFile(corpusPath);
  const parsedCorpus: unknown = JSON.parse(corpusBytes.toString("utf8"));
  const result = validateQuranCorpus(parsedCorpus);

  if (!result.success) {
    for (const issue of result.error.issues) {
      console.error(`${issue.path.join(".") || "corpus"}: ${issue.message}`);
    }
    process.exitCode = 1;
  } else {
    console.log(`Validated ${result.data.surahs.length} surahs and 6,236 ayahs.`);
  }

  if (result.success) {
    console.log(`Validated ${getJuzIndex().length} contiguous Juz ranges.`);
    const sourceBytes = await readFile(sourcePath);
    const actualChecksum = createHash("sha256").update(sourceBytes).digest("hex");
    if (!sourceChecksumMatches(result.data.source.sha256, actualChecksum)) {
      console.error(`Source checksum mismatch for ${sourcePath}.`);
      process.exitCode = 1;
    } else {
      console.log(`Source checksum verified: ${actualChecksum}`);
    }
  }
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Unable to read or validate the Quran corpus.",
  );
  process.exitCode = 1;
}