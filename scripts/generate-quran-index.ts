import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { QuranSurahMetadataSchema, validateQuranCorpus } from "@muslim-ayat/quran-data";

const corpusPath = resolve("packages/quran-data/src/data/quran.json");
const metadataPath = resolve("packages/quran-data/src/data/surah-metadata.json");
const indexPath = resolve("packages/quran-data/src/generated/surah-index.json");

try {
  const rawCorpus = await readFile(corpusPath, "utf8");
  const rawMetadata = await readFile(metadataPath, "utf8");
  const result = validateQuranCorpus(JSON.parse(rawCorpus) as unknown);
  const metadataResult = QuranSurahMetadataSchema.safeParse(JSON.parse(rawMetadata) as unknown);

  if (!result.success || !metadataResult.success) {
    if (!result.success) {
      for (const issue of result.error.issues) {
        console.error(`${issue.path.join(".") || "corpus"}: ${issue.message}`);
      }
    }
    if (!metadataResult.success) {
      for (const issue of metadataResult.error.issues) {
        console.error(`${issue.path.join(".") || "metadata"}: ${issue.message}`);
      }
    }
    process.exitCode = 1;
  } else {
    const metadataByNumber = new Map(
      metadataResult.data.surahs.map((surah) => [surah.number, surah]),
    );
    const index = result.data.surahs.map(({ number, ayahs }) => {
      const metadata = metadataByNumber.get(number);
      if (!metadata) throw new Error(`Missing QUL metadata for surah ${number}.`);

      return {
        number,
        nameArabic: metadata.nameArabic,
        nameTransliteration: metadata.nameTransliteration,
        ayahCount: ayahs.length,
      };
    });
    await mkdir(dirname(indexPath), { recursive: true });
    await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
    console.log(`Generated a ${index.length}-surah index at ${indexPath}.`);
  }
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Unable to read or generate the Quran index.",
  );
  process.exitCode = 1;
}