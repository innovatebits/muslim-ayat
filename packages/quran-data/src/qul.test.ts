import { describe, expect, it } from "vitest";
import { buildQulCorpus, SURAH_AYAH_COUNTS } from "./index";

const source = {
  source: "Quranic Universal Library (QUL)",
  edition: "Uthmani Simple (Ayah by Ayah, Hafs, Me-Quran), resource 82",
  license: null,
  rightsStatus: "unknown" as const,
  url: "https://qul.tarteel.ai/resources/quran-script/82",
  sha256: "a".repeat(64),
  verifiedAt: "2026-11-24T20:34:27.044Z",
};

function makeQulExport() {
  const verses: Record<string, unknown> = {};
  let id = 1;

  SURAH_AYAH_COUNTS.forEach((ayahCount, surahIndex) => {
    const surah = surahIndex + 1;
    for (let ayah = 1; ayah <= ayahCount; ayah += 1) {
      const verseKey = `${surah}:${ayah}`;
      verses[verseKey] = {
        id,
        verse_key: verseKey,
        surah,
        ayah,
        text: `test-ayah-ا-${id}`,
      };
      id += 1;
    }
  });

  return verses;
}

describe("QUL Quran text import", () => {
  it("preserves source ayah text and validates all 114 surahs", () => {
    const corpus = buildQulCorpus(makeQulExport(), source);

    expect(corpus.surahs).toHaveLength(114);
    expect(corpus.surahs[0]?.ayahs[0]?.textUthmani).toBe("test-ayah-ا-1");
    expect(corpus.surahs[113]?.ayahs[5]?.textUthmani).toBe("test-ayah-ا-6236");
  });

  it("rejects missing ayahs", () => {
    const sourceExport = makeQulExport();
    delete sourceExport["1:1"];

    expect(() => buildQulCorpus(sourceExport, source)).toThrow("Missing QUL ayah 1:1");
  });

  it("rejects source records whose verse key does not match their data", () => {
    const sourceExport = makeQulExport();
    const firstAyah = sourceExport["1:1"] as { verse_key: string };
    firstAyah.verse_key = "2:1";

    expect(() => buildQulCorpus(sourceExport, source)).toThrow("Invalid QUL ayah 1:1");
  });
});