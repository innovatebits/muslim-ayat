import { z } from "zod";
import {
  EXPECTED_AYAH_COUNT,
  QuranTafsirExportSchema,
  QuranWordByWordExportSchema,
  QuranWordByWordValidationSchema,
  SURAH_AYAH_COUNTS,
  type QuranTafsirExport,
  type QuranWordByWordValidation,
} from "./index";

const QuranTafsirRawEntrySchema = z.union([
  z.string().regex(/^\d{1,3}:\d{1,3}$/u),
  z
    .object({
      text: z.string().refine((text) => text.trim().length > 0),
      ayah_keys: z.array(z.string().regex(/^\d{1,3}:\d{1,3}$/u)).min(1).optional(),
    })
    .strict(),
]);

const QuranTafsirRawExportSchema = z.record(
  z.string().regex(/^\d{1,3}:\d{1,3}$/u),
  QuranTafsirRawEntrySchema,
);

export function buildQulTafsirIndex(input: unknown): QuranTafsirExport {
  const rawExport = QuranTafsirRawExportSchema.parse(input);
  const expectedKeys = new Set<string>();
  SURAH_AYAH_COUNTS.forEach((ayahCount, surahIndex) => {
    for (let ayahNumber = 1; ayahNumber <= ayahCount; ayahNumber += 1) {
      expectedKeys.add(`${surahIndex + 1}:${ayahNumber}`);
    }
  });

  const verses: Record<string, { text: string }> = {};
  for (const [sourceKey, entry] of Object.entries(rawExport)) {
    if (typeof entry === "string") continue;

    const ayahKeys = entry.ayah_keys ?? [sourceKey];
    if (ayahKeys[0] !== sourceKey || new Set(ayahKeys).size !== ayahKeys.length) {
      throw new Error(`Invalid QUL tafsir ayah grouping at ${sourceKey}`);
    }
    for (const ayahKey of ayahKeys) {
      if (!expectedKeys.has(ayahKey) || verses[ayahKey]) {
        throw new Error(`Unexpected or duplicate QUL tafsir ayah ${ayahKey}`);
      }
      if (ayahKey !== sourceKey && rawExport[ayahKey] !== sourceKey) {
        throw new Error(`Invalid QUL tafsir group reference ${ayahKey} -> ${sourceKey}`);
      }
      verses[ayahKey] = { text: entry.text };
    }
  }

  for (const [aliasKey, entry] of Object.entries(rawExport)) {
    if (typeof entry !== "string") continue;
    const sourceEntry = rawExport[entry];
    if (
      typeof sourceEntry === "string" ||
      !sourceEntry?.ayah_keys?.includes(aliasKey) ||
      !verses[aliasKey]
    ) {
      throw new Error(`Invalid QUL tafsir alias ${aliasKey} -> ${entry}`);
    }
  }

  if (Object.keys(rawExport).length !== EXPECTED_AYAH_COUNT) {
    throw new Error(`Expected ${EXPECTED_AYAH_COUNT} raw tafsir entries, received ${Object.keys(rawExport).length}`);
  }

  return QuranTafsirExportSchema.parse(verses);
}

function compareWordKeys(left: string, right: string) {
  const leftParts = left.split(":").map(Number);
  const rightParts = right.split(":").map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

export function buildQulWordByWordValidation(
  englishInput: unknown,
  verifiedAt: string,
  expectedAyahCounts: readonly number[] = SURAH_AYAH_COUNTS,
): QuranWordByWordValidation {
  const english = QuranWordByWordExportSchema.parse(englishInput);
  const englishEntries = Object.entries(english);
  const verses = new Map<string, { wordNumbers: number[]; markerWordNumbers: number[] }>();

  for (const [key, translation] of englishEntries) {
    const [surahValue, ayahValue, wordValue] = key.split(":");
    const surahNumber = Number(surahValue);
    const ayahNumber = Number(ayahValue);
    const wordNumber = Number(wordValue);
    const expectedAyahCount = expectedAyahCounts[surahNumber - 1];
    if (
      expectedAyahCount === undefined ||
      ayahNumber < 1 ||
      ayahNumber > expectedAyahCount ||
      wordNumber < 1 ||
      !translation.trim()
    ) {
      throw new Error(`Invalid QUL English word entry ${key}`);
    }

    const verseKey = `${surahNumber}:${ayahNumber}`;
    const verse = verses.get(verseKey) ?? { wordNumbers: [], markerWordNumbers: [] };
    const marker = translation.match(/^\((\d+)\)$/u);
    if (marker) {
      if (Number(marker[1]) !== ayahNumber) {
        throw new Error(`Invalid QUL verse marker ${key}`);
      }
      verse.markerWordNumbers.push(wordNumber);
    } else {
      verse.wordNumbers.push(wordNumber);
    }
    verses.set(verseKey, verse);
  }

  const missingGlossKeys: string[] = [];
  const wordCountsByVerse: Record<string, number> = {};
  const markerWordNumbersByVerse: Record<string, number> = {};
  let wordPositionCount = 0;
  let verseMarkerCount = 0;
  let englishGlossCount = 0;

  expectedAyahCounts.forEach((ayahCount, surahIndex) => {
    const surahNumber = surahIndex + 1;
    for (let ayahNumber = 1; ayahNumber <= ayahCount; ayahNumber += 1) {
      const verseKey = `${surahNumber}:${ayahNumber}`;
      const verse = verses.get(verseKey);
      if (!verse || verse.markerWordNumbers.length !== 1) {
        throw new Error(`Expected one QUL verse marker for ayah ${verseKey}`);
      }

      const markerWordNumber = verse.markerWordNumbers[0];
      const wordCount = markerWordNumber - 1;
      if (wordCount < 1 || verse.wordNumbers.some((number) => number >= markerWordNumber)) {
        throw new Error(`Invalid QUL word positions for ayah ${verseKey}`);
      }

      wordCountsByVerse[verseKey] = wordCount;
      markerWordNumbersByVerse[verseKey] = markerWordNumber;
      wordPositionCount += wordCount;
      verseMarkerCount += 1;

      const presentWordNumbers = new Set(verse.wordNumbers);
      for (let wordNumber = 1; wordNumber <= wordCount; wordNumber += 1) {
        if (presentWordNumbers.has(wordNumber)) englishGlossCount += 1;
        else missingGlossKeys.push(`${verseKey}:${wordNumber}`);
      }
    }
  });

  const expectedVerseCount = expectedAyahCounts.reduce((total, count) => total + count, 0);
  if (verses.size !== expectedVerseCount) {
    throw new Error(`Expected ${expectedVerseCount} QUL word-by-word verses, received ${verses.size}`);
  }

  return QuranWordByWordValidationSchema.parse({
    wordPositionCount,
    verseMarkerCount,
    englishEntryCount: englishEntries.length,
    englishGlossCount,
    wordCountsByVerse,
    markerWordNumbersByVerse,
    missingGlossKeys: missingGlossKeys.sort(compareWordKeys),
    verifiedAt,
  });
}