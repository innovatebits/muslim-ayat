import { describe, expect, it } from "vitest";
import { getStudyAyah, getStudySources } from "./study";

describe("Quran study resource access", () => {
  it("returns separately attributed tafsir and English word glosses", () => {
    const ayah = getStudyAyah(1, 1);

    expect(ayah?.tafsir.length).toBeGreaterThan(100);
    expect(ayah?.words[0]).toMatchObject({ number: 1, gloss: "In (the) name" });
    expect(ayah?.sources.tafsir.rightsReview.reviewStatus).toBe("unreviewed");
    expect(ayah?.sources.wordByWord.rightsReview.reviewStatus).toBe("unreviewed");
  });

  it("leaves missing word glosses empty instead of filling them", () => {
    const ayah = getStudyAyah(2, 181);

    expect(ayah?.missingGlossNumbers).toContain(4);
    expect(ayah?.words.find((word) => word.number === 4)?.gloss).toBeNull();
  });

  it("rejects invalid Quran references and exposes study source records", () => {
    expect(getStudyAyah(1, 8)).toBeUndefined();
    expect(getStudySources()).toMatchObject([
      { kind: "tafsir", source: { rightsReview: { reviewStatus: "unreviewed" } } },
      {
        kind: "word-by-word-translation",
        source: { rightsReview: { reviewStatus: "unreviewed" } },
      },
    ]);
  });
});