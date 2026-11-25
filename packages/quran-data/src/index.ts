import { z } from "zod";

export const EXPECTED_SURAH_COUNT = 114;
export const EXPECTED_AYAH_COUNT = 6236;

export const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98,
  135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75,
  85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29,
  19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9,
  5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
] as const;

export const QuranSourceSchema = z
  .object({
    source: z.string().min(1),
    edition: z.string().min(1),
    attributionNote: z.string().min(1).optional(),
    license: z.string().min(1).nullable(),
    rightsStatus: z.enum(["unknown", "verified"]),
    url: z.string().url(),
    sha256: z.string().regex(/^[a-f\d]{64}$/i),
    verifiedAt: z.string().datetime(),
  })
  .strict();

export type QuranSource = z.infer<typeof QuranSourceSchema>;

const AyahSchema = z
  .object({
    number: z.number().int().positive(),
    textUthmani: z.string().min(1).regex(/[\u0600-\u06ff]/u),
  })
  .strict();

const SurahSchema = z
  .object({
    number: z.number().int().min(1).max(EXPECTED_SURAH_COUNT),
    nameArabic: z.string().min(1).regex(/[\u0600-\u06ff]/u).optional(),
    nameTransliteration: z.string().min(1).optional(),
    ayahs: z.array(AyahSchema),
  })
  .strict();

export const QuranCorpusSchema = z
  .object({
    source: QuranSourceSchema,
    surahs: z.array(SurahSchema),
  })
  .strict()
  .superRefine((corpus, context) => {
    if (corpus.surahs.length !== EXPECTED_SURAH_COUNT) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Expected ${EXPECTED_SURAH_COUNT} surahs, received ${corpus.surahs.length}`,
        path: ["surahs"],
      });
    }

    corpus.surahs.forEach((surah, index) => {
      const expectedNumber = index + 1;
      if (surah.number !== expectedNumber) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Expected surah number ${expectedNumber}, received ${surah.number}`,
          path: ["surahs", index, "number"],
        });
      }

      const expectedAyahs = SURAH_AYAH_COUNTS[index];
      if (expectedAyahs !== undefined && surah.ayahs.length !== expectedAyahs) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Expected ${expectedAyahs} ayahs, received ${surah.ayahs.length}`,
          path: ["surahs", index, "ayahs"],
        });
      }

      surah.ayahs.forEach((ayah, ayahIndex) => {
        if (ayah.number !== ayahIndex + 1) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Expected ayah number ${ayahIndex + 1}, received ${ayah.number}`,
            path: ["surahs", index, "ayahs", ayahIndex, "number"],
          });
        }
      });
    });
  });

export type QuranCorpus = z.infer<typeof QuranCorpusSchema>;

export const QuranTextResourceSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    locale: z.string().min(2),
    kind: z.enum(["translation", "transliteration"]),
    source: QuranSourceSchema,
    verses: z.record(z.string().regex(/^\d{1,3}:\d{1,3}$/), z.string().min(1)),
  })
  .strict()
  .superRefine((resource, context) => {
    const verseKeys = Object.keys(resource.verses);
    if (verseKeys.length !== EXPECTED_AYAH_COUNT) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Expected ${EXPECTED_AYAH_COUNT} companion ayahs, received ${verseKeys.length}`,
        path: ["verses"],
      });
    }

    let firstMissingKey: string | undefined;
    SURAH_AYAH_COUNTS.some((ayahCount, surahIndex) => {
      const surah = surahIndex + 1;
      return Array.from({ length: ayahCount }, (_, ayahIndex) => `${surah}:${ayahIndex + 1}`).some(
        (verseKey) => {
          if (!(verseKey in resource.verses)) {
            firstMissingKey = verseKey;
            return true;
          }
          return false;
        },
      );
    });

    if (firstMissingKey) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Missing companion ayah ${firstMissingKey}`,
        path: ["verses", firstMissingKey],
      });
    }
  });

export type QuranTextResource = z.infer<typeof QuranTextResourceSchema>;

export const QuranCompanionBundleSchema = z
  .object({
    translations: z.array(QuranTextResourceSchema),
    transliterations: z.array(QuranTextResourceSchema),
  })
  .strict()
  .superRefine((bundle, context) => {
    bundle.translations.forEach((resource, index) => {
      if (resource.kind !== "translation") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Expected a translation resource",
          path: ["translations", index, "kind"],
        });
      }
    });
    bundle.transliterations.forEach((resource, index) => {
      if (resource.kind !== "transliteration") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Expected a transliteration resource",
          path: ["transliterations", index, "kind"],
        });
      }
    });
  });

export type QuranCompanionBundle = z.infer<typeof QuranCompanionBundleSchema>;

export const QuranTafsirMetadataSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    locale: z.string().min(2),
    kind: z.literal("tafsir"),
    source: QuranSourceSchema,
  })
  .strict();

export type QuranTafsirMetadata = z.infer<typeof QuranTafsirMetadataSchema>;

export const QuranTafsirExportSchema = z
  .record(
    z.string().regex(/^\d{1,3}:\d{1,3}$/u),
    z
      .object({
        text: z.string().refine((text) => text.trim().length > 0),
      })
      .strict(),
  )
  .superRefine((verses, context) => {
    const expectedKeys = new Set<string>();
    let issueCount = 0;
    SURAH_AYAH_COUNTS.forEach((ayahCount, surahIndex) => {
      for (let ayahNumber = 1; ayahNumber <= ayahCount; ayahNumber += 1) {
        const key = `${surahIndex + 1}:${ayahNumber}`;
        expectedKeys.add(key);
        if (!(key in verses) && issueCount < 25) {
          context.addIssue({ code: z.ZodIssueCode.custom, message: `Missing tafsir ayah ${key}`, path: [key] });
          issueCount += 1;
        }
      }
    });

    for (const key of Object.keys(verses)) {
      const [surahValue, ayahValue] = key.split(":");
      const surahNumber = Number(surahValue);
      const ayahNumber = Number(ayahValue);
      const expectedAyahCount = SURAH_AYAH_COUNTS[surahNumber - 1];
      if (
        !expectedKeys.has(key) ||
        expectedAyahCount === undefined ||
        ayahNumber < 1 ||
        ayahNumber > expectedAyahCount
      ) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Unexpected tafsir ayah ${key}`, path: [key] });
      }
    }

    if (Object.keys(verses).length !== EXPECTED_AYAH_COUNT) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Expected ${EXPECTED_AYAH_COUNT} tafsir ayahs, received ${Object.keys(verses).length}`,
        path: [],
      });
    }
  });

export type QuranTafsirExport = z.infer<typeof QuranTafsirExportSchema>;

export const QuranWordByWordExportSchema = z
  .record(z.string().regex(/^\d{1,3}:\d{1,3}:\d{1,3}$/u), z.string().refine((text) => text.trim().length > 0))
  .superRefine((words, context) => {
    for (const key of Object.keys(words)) {
      const [surahValue, ayahValue, wordValue] = key.split(":");
      const surahNumber = Number(surahValue);
      const ayahNumber = Number(ayahValue);
      const wordNumber = Number(wordValue);
      const expectedAyahCount = SURAH_AYAH_COUNTS[surahNumber - 1];
      if (
        expectedAyahCount === undefined ||
        ayahNumber < 1 ||
        ayahNumber > expectedAyahCount ||
        wordNumber < 1
      ) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid word-by-word key ${key}`, path: [key] });
      }
    }
  });

export type QuranWordByWordExport = z.infer<typeof QuranWordByWordExportSchema>;

export const QuranWordByWordValidationSchema = z
  .object({
    wordPositionCount: z.number().int().positive(),
    verseMarkerCount: z.number().int().min(0).max(EXPECTED_AYAH_COUNT),
    englishEntryCount: z.number().int().positive(),
    englishGlossCount: z.number().int().min(0),
    wordCountsByVerse: z.record(z.string().regex(/^\d{1,3}:\d{1,3}$/u), z.number().int().positive()),
    markerWordNumbersByVerse: z.record(
      z.string().regex(/^\d{1,3}:\d{1,3}$/u),
      z.number().int().positive(),
    ),
    missingGlossKeys: z.array(z.string().regex(/^\d{1,3}:\d{1,3}:\d{1,3}$/u)),
    verifiedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((validation, context) => {
    const wordCountKeys = Object.keys(validation.wordCountsByVerse);
    const markerKeys = Object.keys(validation.markerWordNumbersByVerse);
    const totalWordPositions = Object.values(validation.wordCountsByVerse).reduce(
      (total, count) => total + count,
      0,
    );
    if (wordCountKeys.length !== markerKeys.length || markerKeys.some((key) => !(key in validation.wordCountsByVerse))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Word counts and verse marker positions must cover the same verses",
        path: ["markerWordNumbersByVerse"],
      });
    }
    if (
      validation.englishEntryCount !== validation.englishGlossCount + validation.verseMarkerCount ||
      validation.wordPositionCount !== totalWordPositions ||
      validation.wordPositionCount !== validation.englishGlossCount + validation.missingGlossKeys.length ||
      validation.verseMarkerCount !== wordCountKeys.length ||
      validation.missingGlossKeys.length !== new Set(validation.missingGlossKeys).size
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Word-by-word validation totals do not reconcile",
        path: [],
      });
    }
  });

export type QuranWordByWordValidation = z.infer<typeof QuranWordByWordValidationSchema>;

export const QuranWordByWordMetadataSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    locale: z.string().min(2),
    kind: z.literal("word-by-word-translation"),
    source: QuranSourceSchema,
  })
  .strict();

export type QuranWordByWordMetadata = z.infer<typeof QuranWordByWordMetadataSchema>;

export const QuranStudyAyahSchema = z
  .object({
    surahNumber: z.number().int().min(1).max(EXPECTED_SURAH_COUNT),
    ayahNumber: z.number().int().positive(),
    tafsir: z.string().min(1),
    words: z
      .array(
        z
          .object({
            number: z.number().int().positive(),
            gloss: z.string().nullable(),
          })
          .strict(),
      )
      .min(1),
    missingGlossNumbers: z.array(z.number().int().positive()),
    sources: z
      .object({
        tafsir: QuranSourceSchema,
        wordByWord: QuranSourceSchema,
      })
      .strict(),
  })
  .strict();

export type QuranStudyAyah = z.infer<typeof QuranStudyAyahSchema>;

const QuranSurahMetadataRecordSchema = z
  .object({
    number: z.number().int().min(1).max(EXPECTED_SURAH_COUNT),
    nameTransliteration: z.string().min(1),
    nameSimple: z.string().min(1),
    nameArabic: z.string().min(1).regex(/[\u0600-\u06ff]/u),
    revelationOrder: z.number().int().min(1).max(EXPECTED_SURAH_COUNT),
    revelationPlace: z.enum(["makkah", "madinah"]),
    ayahCount: z.number().int().positive(),
    bismillahPre: z.boolean(),
  })
  .strict();

export const QuranSurahMetadataSchema = z
  .object({
    source: QuranSourceSchema,
    surahs: z.array(QuranSurahMetadataRecordSchema),
  })
  .strict()
  .superRefine((metadata, context) => {
    if (metadata.surahs.length !== EXPECTED_SURAH_COUNT) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Expected ${EXPECTED_SURAH_COUNT} surah records, received ${metadata.surahs.length}`,
        path: ["surahs"],
      });
    }

    metadata.surahs.forEach((surah, index) => {
      const expectedNumber = index + 1;
      if (surah.number !== expectedNumber) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Expected surah metadata number ${expectedNumber}, received ${surah.number}`,
          path: ["surahs", index, "number"],
        });
      }

      const expectedAyahs = SURAH_AYAH_COUNTS[index];
      if (surah.ayahCount !== expectedAyahs) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Expected ${expectedAyahs} metadata ayahs, received ${surah.ayahCount}`,
          path: ["surahs", index, "ayahCount"],
        });
      }
    });
  });

export type QuranSurahMetadata = z.infer<typeof QuranSurahMetadataSchema>;

export type QuranTextResourceMetadata = Pick<
  QuranTextResource,
  "id" | "name" | "locale" | "kind" | "source"
>;

const QulAyahSchema = z
  .object({
    id: z.number().int().positive(),
    verse_key: z.string().regex(/^\d{1,3}:\d{1,3}$/),
    surah: z.number().int().min(1).max(EXPECTED_SURAH_COUNT),
    ayah: z.number().int().positive(),
    text: z.string().min(1),
  })
  .strict();

const QulExportSchema = z.record(z.string(), QulAyahSchema);
const QulCompanionExportSchema = z.record(
  z.string(),
  z.object({ t: z.string().min(1) }).passthrough(),
);
const QulSurahMetadataRecordSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    name_simple: z.string().min(1),
    name_arabic: z.string().min(1).regex(/[\u0600-\u06ff]/u),
    revelation_order: z.number().int().positive(),
    revelation_place: z.enum(["makkah", "madinah"]),
    verses_count: z.number().int().positive(),
    bismillah_pre: z.boolean(),
  })
  .strict();
const QulSurahMetadataExportSchema = z.record(z.string(), QulSurahMetadataRecordSchema);

export function sourceChecksumMatches(expected: string, actual: string) {
  const checksumPattern = /^[a-f\d]{64}$/i;
  return (
    checksumPattern.test(expected) &&
    checksumPattern.test(actual) &&
    expected.toLowerCase() === actual.toLowerCase()
  );
}

export function buildQulCorpus(input: unknown, source: QuranSource): QuranCorpus {
  const parsedExport = QulExportSchema.parse(input);
  const entries = Object.keys(parsedExport);

  if (entries.length > EXPECTED_AYAH_COUNT) {
    throw new Error(`Expected ${EXPECTED_AYAH_COUNT} QUL ayahs, received ${entries.length}`);
  }

  let expectedId = 1;
  const surahs = SURAH_AYAH_COUNTS.map((ayahCount, surahIndex) => {
    const number = surahIndex + 1;
    const ayahs = Array.from({ length: ayahCount }, (_, ayahIndex) => {
      const ayahNumber = ayahIndex + 1;
      const verseKey = `${number}:${ayahNumber}`;
      const entry = parsedExport[verseKey];

      if (!entry) {
        throw new Error(`Missing QUL ayah ${verseKey}`);
      }

      if (
        entry.id !== expectedId ||
        entry.verse_key !== verseKey ||
        entry.surah !== number ||
        entry.ayah !== ayahNumber
      ) {
        throw new Error(`Invalid QUL ayah ${verseKey}`);
      }

      expectedId += 1;
      return { number: ayahNumber, textUthmani: entry.text };
    });

    return { number, ayahs };
  });

  return QuranCorpusSchema.parse({ source, surahs });
}

export function buildQulTextResource(
  input: unknown,
  metadata: QuranTextResourceMetadata,
): QuranTextResource {
  const parsedExport = QulCompanionExportSchema.parse(input);
  const entries = Object.keys(parsedExport);

  if (entries.length > EXPECTED_AYAH_COUNT) {
    throw new Error(`Expected ${EXPECTED_AYAH_COUNT} QUL companion ayahs, received ${entries.length}`);
  }

  const verses: Record<string, string> = {};
  for (let surahIndex = 0; surahIndex < SURAH_AYAH_COUNTS.length; surahIndex += 1) {
    const ayahCount = SURAH_AYAH_COUNTS[surahIndex];
    if (ayahCount === undefined) continue;

    const surah = surahIndex + 1;
    for (let ayah = 1; ayah <= ayahCount; ayah += 1) {
      const verseKey = `${surah}:${ayah}`;
      const entry = parsedExport[verseKey];
      if (!entry) {
        throw new Error(`Missing QUL companion ayah ${verseKey}`);
      }
      verses[verseKey] = entry.t;
    }
  }

  return QuranTextResourceSchema.parse({ ...metadata, verses });
}

export function buildQulSurahMetadata(input: unknown, source: QuranSource): QuranSurahMetadata {
  const parsedExport = QulSurahMetadataExportSchema.parse(input);
  const entries = Object.keys(parsedExport);

  if (entries.length > EXPECTED_SURAH_COUNT) {
    throw new Error(`Expected ${EXPECTED_SURAH_COUNT} QUL surahs, received ${entries.length}`);
  }

  const surahs = Array.from({ length: EXPECTED_SURAH_COUNT }, (_, index) => {
    const number = index + 1;
    const entry = parsedExport[String(number)];
    if (!entry) {
      throw new Error(`Missing QUL surah metadata ${number}`);
    }
    if (entry.id !== number || entry.verses_count !== SURAH_AYAH_COUNTS[index]) {
      throw new Error(`Invalid QUL surah metadata ${number}`);
    }

    return {
      number,
      nameTransliteration: entry.name,
      nameSimple: entry.name_simple,
      nameArabic: entry.name_arabic,
      revelationOrder: entry.revelation_order,
      revelationPlace: entry.revelation_place,
      ayahCount: entry.verses_count,
      bismillahPre: entry.bismillah_pre,
    };
  });

  return QuranSurahMetadataSchema.parse({ source, surahs });
}

export function validateQuranCorpus(input: unknown) {
  return QuranCorpusSchema.safeParse(input);
}