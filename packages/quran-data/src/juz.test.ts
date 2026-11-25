import { describe, expect, it } from "vitest";
import juzData from "./data/juz-boundaries.json";
import {
  getJuzByNumber,
  getJuzForAyah,
  getJuzIndex,
  QuranJuzResourceSchema,
} from "./juz";

const expectedRanges = [
  ["1:1", "2:141"],
  ["2:142", "2:252"],
  ["2:253", "3:92"],
  ["3:93", "4:23"],
  ["4:24", "4:147"],
  ["4:148", "5:81"],
  ["5:82", "6:110"],
  ["6:111", "7:87"],
  ["7:88", "8:40"],
  ["8:41", "9:92"],
  ["9:93", "11:5"],
  ["11:6", "12:52"],
  ["12:53", "14:52"],
  ["15:1", "16:128"],
  ["17:1", "18:74"],
  ["18:75", "20:135"],
  ["21:1", "22:78"],
  ["23:1", "25:20"],
  ["25:21", "27:55"],
  ["27:56", "29:45"],
  ["29:46", "33:30"],
  ["33:31", "36:27"],
  ["36:28", "39:31"],
  ["39:32", "41:46"],
  ["41:47", "45:37"],
  ["46:1", "51:30"],
  ["51:31", "57:29"],
  ["58:1", "66:12"],
  ["67:1", "77:50"],
  ["78:1", "114:6"],
] as const;

function verseKey(reference: { surah: number; ayah: number }) {
  return `${reference.surah}:${reference.ayah}`;
}

type MutableJuzResource = {
  provenance: { licenseStatus: string };
  juzs: Array<{
    number: number;
    start: { surah: number; ayah: number };
    end: { surah: number; ayah: number };
  }>;
};

const invalidMutations: Array<[string, (data: MutableJuzResource) => void]> = [
  ["invalid Surah number", (data) => (data.juzs[0]!.start.surah = 115)],
  ["invalid ayah number", (data) => (data.juzs[0]!.start.ayah = 8)],
  ["a gap", (data) => (data.juzs[1]!.start.ayah = 143)],
  ["an overlap", (data) => (data.juzs[1]!.start.ayah = 141)],
  ["duplicate Juz number", (data) => (data.juzs[1]!.number = 1)],
  ["unverified licensing", (data) => (data.provenance.licenseStatus = "permitted")],
];

describe("Quran Juz boundaries", () => {
  it("includes all 30 independently verified ranges with provenance", () => {
    const juzs = getJuzIndex();

    expect(juzs).toHaveLength(30);
    expect(juzs.map((juz) => [verseKey(juz.start), verseKey(juz.end)])).toEqual(expectedRanges);
    expect(QuranJuzResourceSchema.parse(juzData).provenance).toMatchObject({
      sourceUrl: "https://api.quran.com/api/v4/juzs",
      verificationUrl: "https://quran411.com/juz-breakdown",
      license: null,
      licenseStatus: "unknown",
    });
  });

  it("looks up a Juz by number and identifies inclusive ayah boundaries", () => {
    expect(getJuzByNumber(2)).toMatchObject({ number: 2, start: { surah: 2, ayah: 142 } });
    expect(getJuzForAyah(2, 141)?.number).toBe(1);
    expect(getJuzForAyah(2, 142)?.number).toBe(2);
    expect(getJuzForAyah(2, 252)?.number).toBe(2);
    expect(getJuzForAyah(2, 253)?.number).toBe(3);
    expect(getJuzForAyah(114, 6)?.number).toBe(30);
    expect(getJuzByNumber(0)).toBeUndefined();
    expect(getJuzByNumber(31)).toBeUndefined();
    expect(getJuzForAyah(0, 1)).toBeUndefined();
    expect(getJuzForAyah(2, 287)).toBeUndefined();
  });

  it.each(invalidMutations)("rejects %s in boundary metadata", (_case, mutate) => {
    const invalidData = structuredClone(juzData) as MutableJuzResource;
    mutate(invalidData);

    expect(() => QuranJuzResourceSchema.parse(invalidData)).toThrow();
  });
});