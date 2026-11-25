/**
 * Domain contracts for verified Quran content.
 *
 * Do not populate these contracts with generated or unverified Quran text.
 * Each dataset must carry source, edition, version and licensing metadata.
 */

export type SurahNumber = number & { readonly __brand: "SurahNumber" };
export type AyahNumber = number & { readonly __brand: "AyahNumber" };

export interface ContentProvenance {
  sourceName: string;
  sourceUrl: string;
  edition: string;
  version: string;
  license: string;
  retrievedAt: string;
}

export interface SurahMetadata {
  number: SurahNumber;
  nameArabic: string;
  nameTransliteration: string;
  nameTranslation: string;
  ayahCount: number;
}

export interface AyahReference {
  surah: SurahNumber;
  ayah: AyahNumber;
}
