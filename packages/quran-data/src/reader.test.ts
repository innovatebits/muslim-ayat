import { describe, expect, it } from "vitest";
import { getContentSources, getSurah, getSurahIndex, searchQuran } from "./reader";

describe("Quran reader data access", () => {
  it("returns the full surah index and ayah content with separate companion text", () => {
    const surahs = getSurahIndex();
    const firstSurah = getSurah(1);

    expect(surahs).toHaveLength(114);
    expect(surahs[0]).toMatchObject({
      number: 1,
      nameArabic: "الفاتحة",
      nameTransliteration: "Al-Fātiĥah",
      ayahCount: 7,
    });
    expect(surahs[1]).toMatchObject({
      number: 2,
      nameArabic: "البقرة",
      nameTransliteration: "Al-Baqarah",
      ayahCount: 286,
    });
    expect(firstSurah?.ayahs[0]).toMatchObject({
      number: 1,
      translation: "In the name of Allāh, the Entirely Merciful, the Especially Merciful.",
      transliteration: "Bismil laahir Rahmaanir Raheem",
    });
    expect(firstSurah?.ayahs[0]?.textUthmani).toMatch(/[\u0600-\u06ff]/u);
  });

  it("returns no surah for an invalid identifier", () => {
    expect(getSurah(0)).toBeUndefined();
    expect(getSurah(115)).toBeUndefined();
  });

  it("includes the QUL metadata and header image sources with unknown rights status", () => {
    const sources = getContentSources();

    expect(sources).toHaveLength(7);
    expect(sources.find((source) => source.id === "qul-surah-metadata")).toMatchObject({
      kind: "surah-metadata",
      source: {
        edition: "Surah names - quran-metadata (Surah by Surah), resource 70",
        rightsStatus: "unknown",
      },
    });
    expect(sources.find((source) => source.id === "qul-surah-headers")).toMatchObject({
      kind: "surah-header",
      source: {
        edition: expect.stringContaining("resource 592"),
        attributionNote: expect.stringContaining("CC BY 4.0"),
        rightsStatus: "unknown",
      },
    });
    expect(sources.find((source) => source.id === "qul-abridged-explanation")).toMatchObject({
      kind: "tafsir",
      source: {
        rightsStatus: "unknown",
        attributionNote: expect.stringContaining("could not be independently verified"),
      },
    });
    expect(sources.find((source) => source.id === "english-word-by-word")).toMatchObject({
      kind: "word-by-word-translation",
      source: { rightsStatus: "unknown", url: "https://qul.tarteel.ai/resources/translation/92" },
    });
  });

  it("searches Arabic, translation, and transliteration by ayah", () => {
    const firstAyah = getSurah(1)?.ayahs[0];

    expect(searchQuran("In the name of Allāh")[0]).toMatchObject({
      surahNumber: 1,
      ayahNumber: 1,
    });
    expect(searchQuran("Bismil laahir")[0]).toMatchObject({
      surahNumber: 1,
      ayahNumber: 1,
    });
    expect(searchQuran(firstAyah?.textUthmani ?? "")[0]).toMatchObject({
      surahNumber: 1,
      ayahNumber: 1,
    });
    expect(searchQuran("   ")).toEqual([]);
  });

  it("handles punctuation-only queries and the default result limit", () => {
    expect(searchQuran("!!!")).toEqual([]);
    expect(searchQuran("الله")).toHaveLength(50);
  });

  it("normalizes Arabic input variants for matching only", () => {
    const cases = [
      { query: "الْحَمْدُ", surahNumber: 1, ayahNumber: 2 },
      { query: "الـحمد", surahNumber: 1, ayahNumber: 2 },
      { query: "إياك نعبد", surahNumber: 1, ayahNumber: 5 },
      { query: "بالآخرة", surahNumber: 2, ayahNumber: 4 },
    ];

    for (const testCase of cases) {
      expect(searchQuran(testCase.query, 100)).toContainEqual(
        expect.objectContaining({
          surahNumber: testCase.surahNumber,
          ayahNumber: testCase.ayahNumber,
        }),
      );
    }
  });

  it("ranks exact and phrase matches stably", () => {
    const phraseResults = searchQuran("الرحمن الرحيم", 100);
    const firstOccurrence = phraseResults.findIndex(
      (result) => result.surahNumber === 1 && result.ayahNumber === 1,
    );
    const secondOccurrence = phraseResults.findIndex(
      (result) => result.surahNumber === 2 && result.ayahNumber === 163,
    );

    expect(phraseResults[0]).toMatchObject({ surahNumber: 1, ayahNumber: 3 });
    expect(firstOccurrence).toBeLessThan(secondOccurrence);
    expect(searchQuran("العلمين الحمد", 100)).toContainEqual(
      expect.objectContaining({ surahNumber: 1, ayahNumber: 2 }),
    );
    expect(searchQuran("الرحمن الرحيم", 1)[0]).toMatchObject({
      surahNumber: 1,
      ayahNumber: 3,
    });
  });

  it("preserves canonical text after normalized search", () => {
    const canonicalText = getSurah(1)?.ayahs[4]?.textUthmani;
    const result = searchQuran("إياك نعبد")[0];

    expect(result?.textUthmani).toBe(canonicalText);
    expect(getSurah(1)?.ayahs[4]?.textUthmani).toBe(canonicalText);
  });
});