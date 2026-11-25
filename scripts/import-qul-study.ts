import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { strFromU8, unzipSync } from "fflate";
import {
  EXPECTED_AYAH_COUNT,
  QuranSourceSchema,
  QuranTafsirMetadataSchema,
  QuranWordByWordMetadataSchema,
  preserveQuranSourceRights,
  UNKNOWN_QURAN_RIGHTS_REVIEW,
} from "@muslim-ayat/quran-data";
import {
  buildQulTafsirIndex,
  buildQulWordByWordValidation,
} from "@muslim-ayat/quran-data/study-import";

const [tafsirArchiveArgument, englishArchiveArgument] = process.argv.slice(2);
const sourceDirectory = resolve("packages/quran-data/src/data/source");
const tafsirPath = resolve(sourceDirectory, "abridged-explanation-of-the-quran.json");
const wordByWordPath = resolve(sourceDirectory, "english-wbw-translation.json");
const tafsirMetadataPath = resolve("packages/quran-data/src/data/tafsir-source.json");
const wordByWordMetadataPath = resolve("packages/quran-data/src/data/word-by-word-source.json");
const wordByWordValidationPath = resolve("packages/quran-data/src/data/word-by-word-validation.json");

async function extractEntry(
  archiveArgument: string | undefined,
  entryName: string,
  savedPath?: string,
) {
  if (!archiveArgument) throw new Error(`Provide an archive containing ${entryName}.`);

  const archiveBytes = await readFile(resolve(archiveArgument));
  const entries = unzipSync(archiveBytes);
  const sourceBytes = entries[entryName];
  if (!sourceBytes) throw new Error(`Missing ${entryName} in ${archiveArgument}`);

  if (savedPath) {
    await mkdir(dirname(savedPath), { recursive: true });
    await writeFile(savedPath, sourceBytes);
  }
  return sourceBytes;
}

function checksum(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

try {
  const verifiedAt = new Date().toISOString();
  const tafsirBytes = await extractEntry(
    tafsirArchiveArgument,
    "abridged-explanation-of-the-quran.json",
    tafsirPath,
  );
  const wordByWordBytes = await extractEntry(
    englishArchiveArgument,
    "english-wbw-translation.json",
    wordByWordPath,
  );
  const tafsir = buildQulTafsirIndex(JSON.parse(strFromU8(tafsirBytes)) as unknown);

  const wordByWordInput = JSON.parse(strFromU8(wordByWordBytes)) as unknown;
  const validation = buildQulWordByWordValidation(wordByWordInput, verifiedAt);

  const expectedMissingGlossKeys = ["2:181:4", "8:6:5", "13:37:9"];
  if (
    Object.keys(tafsir).length !== EXPECTED_AYAH_COUNT ||
    Object.keys(validation.wordCountsByVerse).length !== EXPECTED_AYAH_COUNT ||
    validation.verseMarkerCount !== EXPECTED_AYAH_COUNT ||
    validation.wordPositionCount !== 77_432 ||
    validation.englishEntryCount !== 83_665 ||
    validation.englishGlossCount !== 77_429 ||
    JSON.stringify(validation.missingGlossKeys) !== JSON.stringify(expectedMissingGlossKeys)
  ) {
    throw new Error("The QUL study exports do not match the reviewed verse and word coverage.");
  }

  const previousTafsirMetadata = QuranTafsirMetadataSchema.parse(
    JSON.parse(await readFile(tafsirMetadataPath, "utf8")) as unknown,
  );
  const previousWordByWordMetadata = QuranWordByWordMetadataSchema.parse(
    JSON.parse(await readFile(wordByWordMetadataPath, "utf8")) as unknown,
  );

  const tafsirSource = preserveQuranSourceRights(
    QuranSourceSchema.parse({
      source: "Quranic Universal Library (QUL), user-supplied local export",
      edition:
        "Abridged Explanation of the Quran (6,236-verse JSON export; QUL resource ID and original rights holder not independently verified)",
      attributionNote:
        "The local export's exact catalogue entry and rights holder could not be independently verified. Rights remain unknown; no redistribution clearance is claimed.",
      license: null,
      url: "https://qul.tarteel.ai/resources/tafsir",
      sha256: checksum(tafsirBytes),
      verifiedAt,
      rightsReview: UNKNOWN_QURAN_RIGHTS_REVIEW,
    }),
    previousTafsirMetadata.source,
  );
  const wordByWordSource = QuranWordByWordMetadataSchema.parse({
    id: "english-word-by-word",
    name: "English Word-by-Word Translation",
    locale: "en",
    kind: "word-by-word-translation",
    source: preserveQuranSourceRights(
      {
        source: "Quranic Universal Library (QUL)",
        edition: "English Word by Word Translation, simple JSON, resource 92",
        attributionNote:
          "QUL's resource page does not provide copyright information. Rights remain unknown; no licence or redistribution clearance is claimed. Three indexed word positions have no English gloss and are left unfilled.",
        license: null,
        url: "https://qul.tarteel.ai/resources/translation/92",
        sha256: checksum(wordByWordBytes),
        verifiedAt,
        rightsReview: UNKNOWN_QURAN_RIGHTS_REVIEW,
      },
      previousWordByWordMetadata.source,
    ),
  });
  const tafsirMetadata = QuranTafsirMetadataSchema.parse({
    id: "qul-abridged-explanation",
    name: "Abridged Explanation of the Quran",
    locale: "en",
    kind: "tafsir",
    source: tafsirSource,
  });

  await writeFile(tafsirMetadataPath, `${JSON.stringify(tafsirMetadata, null, 2)}\n`, "utf8");
  await writeFile(
    wordByWordMetadataPath,
    `${JSON.stringify(
      {
        id: wordByWordSource.id,
        name: wordByWordSource.name,
        locale: wordByWordSource.locale,
        kind: wordByWordSource.kind,
        source: wordByWordSource.source,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await writeFile(wordByWordValidationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");

  console.log(`Imported ${Object.keys(tafsir).length} tafsir ayahs.`);
  console.log(
    `Validated ${validation.englishGlossCount} English glosses, ${validation.verseMarkerCount} verse markers, and ${validation.missingGlossKeys.length} missing word glosses.`,
  );
  console.log(`Tafsir source checksum: ${tafsirSource.sha256}`);
  console.log(`Word-by-word source checksum: ${wordByWordSource.source.sha256}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unable to import QUL study resources.");
  process.exitCode = 1;
}