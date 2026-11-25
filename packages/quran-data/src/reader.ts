import companionsJson from "./data/companions.json";
import quranJson from "./data/quran.json";
import surahMetadataJson from "./data/surah-metadata.json";
import surahHeaderSourceJson from "./data/surah-header-source.json";
import tafsirMetadataJson from "./data/tafsir-source.json";
import wordByWordMetadataJson from "./data/word-by-word-source.json";
import {
  QuranCompanionBundleSchema,
  QuranCorpusSchema,
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

export interface QuranContentSource {
  id: string;
  name: string;
  kind:
    | "arabic"
    | "translation"
    | "transliteration"
    | "surah-metadata"
    | "surah-header"
    | "tafsir"
    | "word-by-word-translation";
  source: QuranSource;
}

function getResource(resources: QuranTextResource[], id: string) {
  return resources.find((resource) => resource.id === id);
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
  return [
    {
      id: "quran-uthmani",
      name: "QUL Uthmani Simple",
      kind: "arabic",
      source: corpus.source,
    },
    ...companions.translations.map((resource) => ({
      id: resource.id,
      name: resource.name,
      kind: "translation" as const,
      source: resource.source,
    })),
    ...companions.transliterations.map((resource) => ({
      id: resource.id,
      name: resource.name,
      kind: "transliteration" as const,
      source: resource.source,
    })),
    {
      id: "qul-surah-metadata",
      name: "QUL Surah names",
      kind: "surah-metadata" as const,
      source: surahMetadata.source,
    },
    {
      id: "qul-surah-headers",
      name: "QUL Surah name header images",
      kind: "surah-header" as const,
      source: surahHeaderSource,
    },
    {
      id: tafsirMetadata.id,
      name: tafsirMetadata.name,
      kind: tafsirMetadata.kind,
      source: tafsirMetadata.source,
    },
    {
      id: wordByWordMetadata.id,
      name: wordByWordMetadata.name,
      kind: wordByWordMetadata.kind,
      source: wordByWordMetadata.source,
    },
  ];
}

export function getAvailableTranslations() {
  return companions.translations.map(({ id, name, locale }) => ({ id, name, locale }));
}

export function getAvailableTransliterations() {
  return companions.transliterations.map(({ id, name, locale }) => ({ id, name, locale }));
}