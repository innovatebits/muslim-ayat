import { describe, expect, it } from "vitest";
import { buildQulTextResource, SURAH_AYAH_COUNTS, UNKNOWN_QURAN_RIGHTS_REVIEW } from "./index";

const source = {
  source: "Quranic Universal Library (QUL)",
  edition: "Saheeh International simple JSON",
  license: null,
  url: "https://qul.tarteel.ai/resources/translation/193",
  sha256: "a".repeat(64),
  verifiedAt: "2026-11-24T20:34:27.044Z",
  rightsReview: UNKNOWN_QURAN_RIGHTS_REVIEW,
};

function makeQulTextExport() {
  const verses: Record<string, unknown> = {};
  let id = 1;

  SURAH_AYAH_COUNTS.forEach((ayahCount, surahIndex) => {
    const surah = surahIndex + 1;
    for (let ayah = 1; ayah <= ayahCount; ayah += 1) {
      verses[`${surah}:${ayah}`] = { t: `companion text ${id}` };
      id += 1;
    }
  });

  return verses;
}

describe("QUL companion text import", () => {
  it("preserves translation text and source metadata for all ayahs", () => {
    const resource = buildQulTextResource(makeQulTextExport(), {
      id: "saheeh-international",
      name: "Saheeh International",
      locale: "en",
      kind: "translation",
      source,
    });

    expect(Object.keys(resource.verses)).toHaveLength(6236);
    expect(resource.verses["1:1"]).toBe("companion text 1");
    expect(resource.verses["114:6"]).toBe("companion text 6236");
    expect(resource.source.rightsReview.reviewStatus).toBe("unreviewed");
  });

  it("rejects missing ayah entries", () => {
    const sourceExport = makeQulTextExport();
    delete sourceExport["2:1"];

    expect(() =>
      buildQulTextResource(sourceExport, {
        id: "saheeh-international",
        name: "Saheeh International",
        locale: "en",
        kind: "translation",
        source,
      }),
    ).toThrow("Missing QUL companion ayah 2:1");
  });
});