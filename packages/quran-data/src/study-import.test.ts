import { describe, expect, it } from "vitest";
import { buildQulWordByWordValidation } from "./study-import";

const verifiedAt = "2026-11-25T00:00:00.000Z";

describe("QUL word-by-word import validation", () => {
  it("derives expected word positions from markers and leaves source gaps blank", () => {
    const result = buildQulWordByWordValidation(
      { "1:1:1": "In", "1:1:3": "(1)" },
      verifiedAt,
      [1],
    );

    expect(result).toMatchObject({
      wordPositionCount: 2,
      verseMarkerCount: 1,
      englishGlossCount: 1,
      wordCountsByVerse: { "1:1": 2 },
      markerWordNumbersByVerse: { "1:1": 3 },
      missingGlossKeys: ["1:1:2"],
    });
  });

  it("rejects a verse marker that does not match the ayah key", () => {
    expect(() =>
      buildQulWordByWordValidation({ "1:1:1": "In", "1:1:2": "(2)" }, verifiedAt, [1]),
    ).toThrow("Invalid QUL verse marker 1:1:2");
  });

  it("requires a marker for every expected ayah", () => {
    expect(() => buildQulWordByWordValidation({ "1:1:1": "In" }, verifiedAt, [1])).toThrow(
      "Expected one QUL verse marker for ayah 1:1",
    );
  });
});