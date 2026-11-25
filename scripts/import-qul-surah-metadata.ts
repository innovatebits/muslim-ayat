import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { strFromU8, unzipSync } from "fflate";
import { buildQulSurahMetadata, type QuranSource } from "@muslim-ayat/quran-data";

const [archiveArgument] = process.argv.slice(2);
const sourcePath = resolve("packages/quran-data/src/data/source/quran-metadata-surah-name.json");
const metadataPath = resolve("packages/quran-data/src/data/surah-metadata.json");

try {
  let sourceBytes: Uint8Array;
  if (archiveArgument) {
    const archiveBytes = await readFile(resolve(archiveArgument));
    const entries = unzipSync(archiveBytes);
    const entry = entries["quran-metadata-surah-name.json"];
    if (!entry) throw new Error("Missing quran-metadata-surah-name.json in the QUL archive.");

    sourceBytes = entry;
    await mkdir(dirname(sourcePath), { recursive: true });
    await writeFile(sourcePath, sourceBytes);
  } else {
    sourceBytes = await readFile(sourcePath);
  }

  const source: QuranSource = {
    source: "Quranic Universal Library (QUL)",
    edition: "Surah names - quran-metadata (Surah by Surah), resource 70",
    license: null,
    rightsStatus: "unknown",
    url: "https://qul.tarteel.ai/resources/quran-metadata/70",
    sha256: createHash("sha256").update(sourceBytes).digest("hex"),
    verifiedAt: new Date().toISOString(),
  };
  const metadata = buildQulSurahMetadata(JSON.parse(strFromU8(sourceBytes)) as unknown, source);

  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  console.log(`Imported QUL metadata for ${metadata.surahs.length} surahs.`);
  console.log(`Source checksum: ${source.sha256}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unable to import QUL surah metadata.");
  process.exitCode = 1;
}