import { z } from "zod";
import companionsJson from "./data/companions.json";
import quranJson from "./data/quran.json";
import surahMetadataJson from "./data/surah-metadata.json";
import surahHeaderSourceJson from "./data/surah-header-source.json";
import tafsirMetadataJson from "./data/tafsir-source.json";
import wordByWordMetadataJson from "./data/word-by-word-source.json";
import { QURAN_AUDIO_RECITERS, QURAN_AUDIO_SOURCE } from "./audio";
import {
  QuranCompanionBundleSchema,
  QuranCorpusSchema,
  QuranRightsReviewSchema,
  QuranSourceSchema,
  QuranSurahMetadataSchema,
  QuranTafsirMetadataSchema,
  QuranWordByWordMetadataSchema,
  type QuranSource,
  type QuranTextResource,
} from "./index";

const corpus = QuranCorpusSchema.parse(quranJson as unknown);
const companions = QuranCompanionBundleSchema.parse(companionsJson as unknown);
const surahMetadata = QuranSurahMetadataSchema.parse(surahMetadataJson as unknown);
const surahHeaderSource = QuranSourceSchema.parse(surahHeaderSourceJson as unknown);
const tafsirMetadata = QuranTafsirMetadataSchema.parse(tafsirMetadataJson as unknown);
const wordByWordMetadata = QuranWordByWordMetadataSchema.parse(wordByWordMetadataJson as unknown);

export interface QuranSurahSummary {
  number: number;
  nameArabic: string;
  nameTransliteration: string;
  ayahCount: number;
}

export interface QuranReaderAyah {
  number: number;
  textUthmani: string;
  translation: string | null;
  transliteration: string | null;
}

export interface QuranReaderSurah extends QuranSurahSummary {
  ayahs: QuranReaderAyah[];
}

export interface QuranSearchResult {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  textUthmani: string;
  translation: string | null;
  transliteration: string | null;
}

export const QuranContentSourceSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    kind: z.enum([
      "arabic",
      "translation",
      "transliteration",
      "surah-metadata",
      "surah-header",
      "tafsir",
      "word-by-word-translation",
      "audio",
    ]),
    source: z.string().min(1),
    edition: z.string().min(1),
    url: z.string().url(),
    license: z.string().min(1).nullable(),
    attributionNote: z.string().min(1).optional(),
    rightsReview: QuranRightsReviewSchema,
    integrity: z
      .object({
        sha256: z.string().regex(/^[a-f\d]{64}$/i),
        verifiedAt: z.string().datetime(),
      })
      .strict()
      .nullable(),
  })
  .strict();

export const QuranContentSourcesSchema = z
  .array(QuranContentSourceSchema)
  .superRefine((sources, context) => {
    const seenIds = new Set<string>();
    sources.forEach((source, index) => {
      if (seenIds.has(source.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate Quran content source id: ${source.id}`,
          path: [index, "id"],
        });
      }
      seenIds.add(source.id);
    });
  });

export type QuranContentSource = z.infer<typeof QuranContentSourceSchema>;

function getResource(resources: QuranTextResource[], id: string) {
  return resources.find((resource) => resource.id === id);
}

function createContentSource(
  id: string,
  name: string,
  kind: QuranContentSource["kind"],
  source: QuranSource,
): QuranContentSource {
  return {
    id,
    name,
    kind,
    source: source.source,
    edition: source.edition,
    url: source.url,
    license: source.license,
    ...(source.attributionNote ? { attributionNote: source.attributionNote } : {}),
    rightsReview: source.rightsReview,
    integrity: { sha256: source.sha256, verifiedAt: source.verifiedAt },
  };
}

function getSurahSummary(number: number): QuranSurahSummary | undefined {
  const surah = corpus.surahs[number - 1];
  const metadata = surahMetadata.surahs[number - 1];
  if (!surah || !metadata) return undefined;

  return {
    number: surah.number,
    nameArabic: metadata.nameArabic,
    nameTransliteration: metadata.nameTransliteration,
    ayahCount: surah.ayahs.length,
  };
}

export function getSurahIndex(): QuranSurahSummary[] {
  return corpus.surahs.map((surah) => getSurahSummary(surah.number)!);
}

export function getSurah(number: number): QuranReaderSurah | undefined {
  if (!Number.isInteger(number) || number < 1 || number > corpus.surahs.length) return undefined;

  const surah = corpus.surahs[number - 1];
  const summary = getSurahSummary(number);
  if (!surah || !summary) return undefined;

  const translation = getResource(companions.translations, "saheeh-international");
  const transliteration = getResource(companions.transliterations, "english-transliteration-tajweed");

  return {
    ...summary,
    ayahs: surah.ayahs.map((ayah) => {
      const verseKey = `${surah.number}:${ayah.number}`;
      return {
        number: ayah.number,
        textUthmani: ayah.textUthmani,
        translation: translation?.verses[verseKey] ?? null,
        transliteration: transliteration?.verses[verseKey] ?? null,
      };
    }),
  };
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

export function searchQuran(query: string, limit = 50): QuranSearchResult[] {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return [];

  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.floor(limit), 1), 100) : 50;
  const results: QuranSearchResult[] = [];
  const translation = getResource(companions.translations, "saheeh-international");
  const transliteration = getResource(companions.transliterations, "english-transliteration-tajweed");

  for (const surah of corpus.surahs) {
    const summary = getSurahSummary(surah.number);
    if (!summary) continue;

    for (const ayah of surah.ayahs) {
      const verseKey = `${surah.number}:${ayah.number}`;
      const translationText = translation?.verses[verseKey] ?? null;
      const transliterationText = transliteration?.verses[verseKey] ?? null;
      const searchableText = [ayah.textUthmani, translationText, transliterationText]
        .filter((value): value is string => value !== null)
        .some((value) => normalizeSearch(value).includes(normalizedQuery));

      if (searchableText) {
        results.push({
          surahNumber: surah.number,
          surahName: summary.nameTransliteration,
          ayahNumber: ayah.number,
          textUthmani: ayah.textUthmani,
          translation: translationText,
          transliteration: transliterationText,
        });
      }

      if (results.length >= safeLimit) return results;
    }
  }

  return results;
}

export function getContentSources(): QuranContentSource[] {
  return QuranContentSourcesSchema.parse([
    createContentSource(
      "quran-uthmani",
      "QUL Uthmani Simple",
      "arabic",
      corpus.source,
    ),
    ...companions.translations.map((resource) =>
      createContentSource(resource.id, resource.name, "translation", resource.source),
    ),
    ...companions.transliterations.map((resource) =>
      createContentSource(resource.id, resource.name, "transliteration", resource.source),
    ),
    createContentSource(
      "qul-surah-metadata",
      "QUL Surah names",
      "surah-metadata",
      surahMetadata.source,
    ),
    createContentSource(
      "qul-surah-headers",
      "QUL Surah name header images",
      "surah-header",
      surahHeaderSource,
    ),
    createContentSource(
      tafsirMetadata.id,
      tafsirMetadata.name,
      tafsirMetadata.kind,
      tafsirMetadata.source,
    ),
    createContentSource(
      wordByWordMetadata.id,
      wordByWordMetadata.name,
      wordByWordMetadata.kind,
      wordByWordMetadata.source,
    ),
    {
      id: "audio-provider-terms",
      name: "AlQuran Cloud CDN provider terms",
      kind: "audio",
      source: QURAN_AUDIO_SOURCE.provider,
      edition: "External ayah audio delivery and provider terms",
      url: QURAN_AUDIO_SOURCE.documentationUrl,
      license: null,
      rightsReview: QURAN_AUDIO_SOURCE.providerTermsRightsReview,
      integrity: null,
    },
    ...QURAN_AUDIO_RECITERS.map((reciter) => ({
      id: `audio-recording-${reciter.identifier}`,
      name: `${reciter.englishName} recitation recording and performance`,
      kind: "audio" as const,
      source: QURAN_AUDIO_SOURCE.provider,
      edition: `Ayah recitations for ${reciter.englishName} (${reciter.identifier})`,
      url: QURAN_AUDIO_SOURCE.documentationUrl,
      license: null,
      rightsReview: reciter.recordingPerformanceRights,
      integrity: null,
    })),
  ]);
}

export function getAvailableTranslations() {
  return companions.translations.map(({ id, name, locale }) => ({ id, name, locale }));
}

export function getAvailableTransliterations() {
  return companions.transliterations.map(({ id, name, locale }) => ({ id, name, locale }));
}