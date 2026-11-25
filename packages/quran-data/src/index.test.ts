import { describe, expect, it } from "vitest";
import {
  EXPECTED_AYAH_COUNT,
  EXPECTED_SURAH_COUNT,
  QuranCorpusSchema,
  sourceChecksumMatches,
  SURAH_AYAH_COUNTS,
} from "./index";

const source = {
  source: "Quranic Universal Library (QUL)",
  edition: "Uthmani Simple (Ayah by Ayah, Hafs, Me-Quran), resource 82",
  license: null,
  rightsStatus: "unknown" as const,
  url: "https://qul.tarteel.ai/resources/quran-script/82",
  sha256: "a".repeat(64),
  verifiedAt: "2026-11-24T20:34:27.044Z",
};

function makeSurahs() {
  return SURAH_AYAH_COUNTS.map((count, index) => ({
    number: index + 1,
    ayahs: Array.from({ length: count }, (_, ayahIndex) => ({
      number: ayahIndex + 1,
      textUthmani: "test-ayah-ا",
    })),
  }));
}

describe("Quran corpus integrity constants", () => {
  it("matches the expected total of 114 surahs and 6,236 ayahs", () => {
    expect(SURAH_AYAH_COUNTS).toHaveLength(EXPECTED_SURAH_COUNT);
    expect(SURAH_AYAH_COUNTS.reduce((total, count) => total + count, 0)).toBe(EXPECTED_AYAH_COUNT);
  });

  it("requires source attribution and a complete surah collection", () => {
    const invalidSource = QuranCorpusSchema.safeParse({
      source: {
        source: "",
        edition: "",
        license: null,
        rightsStatus: "unknown",
        url: "not a URL",
        sha256: "",
        verifiedAt: "",
      },
      surahs: [],
    });

    expect(invalidSource.success).toBe(false);
    if (!invalidSource.success) {
      expect(invalidSource.error.issues.some((issue) => issue.path[0] === "source")).toBe(true);
    }

    const missingSurahs = QuranCorpusSchema.safeParse({ source, surahs: [] });

    expect(missingSurahs.success).toBe(false);
    if (!missingSurahs.success) {
      expect(
        missingSurahs.error.issues.some((issue) => issue.message.includes("Expected 114 surahs")),
      ).toBe(true);
    }
  });

  it("accepts a source whose resource-level licence is explicitly unknown", () => {
    expect(QuranCorpusSchema.safeParse({ source, surahs: makeSurahs() }).success).toBe(true);
  });

  it("rejects a corpus missing an ayah", () => {
    const surahs = makeSurahs();
    surahs[0].ayahs.pop();

    const result = QuranCorpusSchema.safeParse({ source, surahs });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "surahs.0.ayahs")).toBe(
        true,
      );
    }
  });

  it("rejects a source checksum mismatch", () => {
    expect(sourceChecksumMatches("a".repeat(64), "b".repeat(64))).toBe(false);
  });
});
