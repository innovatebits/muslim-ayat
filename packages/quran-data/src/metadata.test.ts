import { describe, expect, it } from "vitest";
import { buildQulSurahMetadata, SURAH_AYAH_COUNTS } from "./index";

const source = {
  source: "Quranic Universal Library (QUL)",
  edition: "Surah names - quran-metadata (Surah by Surah), resource 70",
  license: null,
  rightsStatus: "unknown" as const,
  url: "https://qul.tarteel.ai/resources/quran-metadata/70",
  sha256: "a".repeat(64),
  verifiedAt: "2026-11-24T20:48:23.376Z",
};

function makeSurahExport() {
  return Object.fromEntries(
    SURAH_AYAH_COUNTS.map((ayahCount, index) => {
      const number = index + 1;
      return [
        String(number),
        {
          id: number,
          name: `Test name ${number}`,
          name_simple: `Test name ${number}`,
          name_arabic: "سورة",
          revelation_order: number,
          revelation_place: number % 2 === 0 ? "madinah" : "makkah",
          verses_count: ayahCount,
          bismillah_pre: number !== 9,
        },
      ];
    }),
  );
}

describe("QUL surah metadata import", () => {
  it("preserves source names and validates all 114 ayah counts", () => {
    const metadata = buildQulSurahMetadata(makeSurahExport(), source);

    expect(metadata.surahs).toHaveLength(114);
    expect(metadata.surahs[0]).toMatchObject({
      number: 1,
      nameTransliteration: "Test name 1",
      nameSimple: "Test name 1",
      nameArabic: "سورة",
      ayahCount: 7,
    });
    expect(metadata.source.rightsStatus).toBe("unknown");
  });

  it("rejects missing surahs and incorrect ayah counts", () => {
    const sourceExport = makeSurahExport();
    delete sourceExport["114"];

    expect(() => buildQulSurahMetadata(sourceExport, source)).toThrow(
      "Missing QUL surah metadata 114",
    );

    const invalidExport = makeSurahExport();
    invalidExport["1"].verses_count = 8;
    expect(() => buildQulSurahMetadata(invalidExport, source)).toThrow(
      "Invalid QUL surah metadata 1",
    );
  });
});