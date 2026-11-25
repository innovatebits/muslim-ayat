import { z } from "zod";
import {
  QuranRightsReviewSchema,
  SURAH_AYAH_COUNTS,
  UNKNOWN_QURAN_RIGHTS_REVIEW,
} from "./index";

export const QuranAudioSourceSchema = z
  .object({
    provider: z.literal("AlQuran Cloud CDN"),
    documentationUrl: z.literal("https://alquran.cloud/cdn"),
    cdnOrigin: z.literal("https://cdn.islamic.network"),
    delivery: z.literal("external-stream"),
    providerTermsRightsReview: QuranRightsReviewSchema,
  })
  .strict();

export const QURAN_AUDIO_SOURCE = QuranAudioSourceSchema.parse({
  provider: "AlQuran Cloud CDN",
  documentationUrl: "https://alquran.cloud/cdn",
  cdnOrigin: "https://cdn.islamic.network",
  delivery: "external-stream",
  providerTermsRightsReview: UNKNOWN_QURAN_RIGHTS_REVIEW,
});

export const QuranAudioReciterSchema = z
  .object({
    identifier: z.string().regex(/^ar\.[a-z0-9]+$/u),
    englishName: z.string().min(1),
    arabicName: z.string().min(1),
    style: z.enum(["Murattal", "Mujawwad"]),
    bitrate: z.union([z.literal(64), z.literal(128), z.literal(192)]),
    recordingPerformanceRights: QuranRightsReviewSchema,
  })
  .strict();

export const QURAN_AUDIO_RECITERS = QuranAudioReciterSchema.array().parse([
  {
    identifier: "ar.alafasy",
    englishName: "Mishary Rashid Alafasy",
    arabicName: "مشاري راشد العفاسي",
    style: "Murattal",
    bitrate: 128,
    recordingPerformanceRights: UNKNOWN_QURAN_RIGHTS_REVIEW,
  },
  {
    identifier: "ar.husary",
    englishName: "Mahmoud Khalil Al-Husary",
    arabicName: "محمود خليل الحصري",
    style: "Murattal",
    bitrate: 128,
    recordingPerformanceRights: UNKNOWN_QURAN_RIGHTS_REVIEW,
  },
  {
    identifier: "ar.minshawi",
    englishName: "Mohamed Siddiq al-Minshawi",
    arabicName: "محمد صديق المنشاوي",
    style: "Murattal",
    bitrate: 128,
    recordingPerformanceRights: UNKNOWN_QURAN_RIGHTS_REVIEW,
  },
  {
    identifier: "ar.sudais",
    englishName: "Abdul Rahman Al-Sudais",
    arabicName: "عبدالرحمن السديس",
    style: "Murattal",
    bitrate: 192,
    recordingPerformanceRights: UNKNOWN_QURAN_RIGHTS_REVIEW,
  },
  {
    identifier: "ar.abdulbasit",
    englishName: "Abdul Basit Abdul Samad",
    arabicName: "عبد الباسط عبد الصمد",
    style: "Murattal",
    bitrate: 192,
    recordingPerformanceRights: UNKNOWN_QURAN_RIGHTS_REVIEW,
  },
]);

export function getGlobalAyahNumber(surahNumber: number, ayahNumber: number) {
  const ayahCount = SURAH_AYAH_COUNTS[surahNumber - 1];
  if (!ayahCount || !Number.isInteger(ayahNumber) || ayahNumber < 1 || ayahNumber > ayahCount) {
    return undefined;
  }

  return (
    SURAH_AYAH_COUNTS.slice(0, surahNumber - 1).reduce((total, count) => total + count, 0) +
    ayahNumber
  );
}

export function getAyahAudioUrl(surahNumber: number, ayahNumber: number, identifier: string) {
  const reciter = QURAN_AUDIO_RECITERS.find((candidate) => candidate.identifier === identifier);
  const globalNumber = getGlobalAyahNumber(surahNumber, ayahNumber);
  if (!reciter || !globalNumber) return undefined;

  return `${QURAN_AUDIO_SOURCE.cdnOrigin}/quran/audio/${reciter.bitrate}/${reciter.identifier}/${globalNumber}.mp3`;
}

export function isAudioFeatureEnabled(flag: string | undefined) {
  return flag !== "false";
}