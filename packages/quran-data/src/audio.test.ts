import { describe, expect, it } from "vitest";
import {
  getAyahAudioUrl,
  getGlobalAyahNumber,
  isAudioFeatureEnabled,
  QURAN_AUDIO_RECITERS,
  QURAN_AUDIO_SOURCE,
} from "./audio";

describe("AlQuran Cloud recitation references", () => {
  it("maps surah ayahs to global ayah numbers and validated CDN URLs", () => {
    expect(getGlobalAyahNumber(1, 1)).toBe(1);
    expect(getGlobalAyahNumber(2, 1)).toBe(8);
    expect(getGlobalAyahNumber(114, 6)).toBe(6236);
    expect(getAyahAudioUrl(2, 1, "ar.alafasy")).toBe(
      "https://cdn.islamic.network/quran/audio/128/ar.alafasy/8.mp3",
    );
  });

  it("rejects invalid ayahs and unknown reciter identifiers", () => {
    expect(getGlobalAyahNumber(1, 8)).toBeUndefined();
    expect(getAyahAudioUrl(1, 1, "https://example.test/recording.mp3")).toBeUndefined();
  });

  it("records external streaming and unknown rights without claiming clearance", () => {
    expect(QURAN_AUDIO_SOURCE).toMatchObject({
      provider: "AlQuran Cloud CDN",
      delivery: "external-stream",
      rightsStatus: "unknown",
    });
    expect(QURAN_AUDIO_RECITERS.length).toBeGreaterThan(1);
    expect(isAudioFeatureEnabled("false")).toBe(false);
    expect(isAudioFeatureEnabled("true")).toBe(true);
    expect(isAudioFeatureEnabled(undefined)).toBe(true);
  });
});