import tafsirExportJson from "./data/source/abridged-explanation-of-the-quran.json";
import englishWordByWordJson from "./data/source/english-wbw-translation.json";
import tafsirMetadataJson from "./data/tafsir-source.json";
import wordByWordMetadataJson from "./data/word-by-word-source.json";
import wordByWordValidationJson from "./data/word-by-word-validation.json";
import {
  QuranTafsirExportSchema,
  QuranTafsirMetadataSchema,
  QuranStudyAyahSchema,
  QuranWordByWordExportSchema,
  QuranWordByWordMetadataSchema,
  QuranWordByWordValidationSchema,
  type QuranSource,
  type QuranStudyAyah,
} from "./index";
import { getSurah } from "./reader";
import { buildQulTafsirIndex } from "./study-import";

const tafsir = QuranTafsirExportSchema.parse(buildQulTafsirIndex(tafsirExportJson as unknown));
const englishWordByWord = QuranWordByWordExportSchema.parse(englishWordByWordJson as unknown);
const tafsirMetadata = QuranTafsirMetadataSchema.parse(tafsirMetadataJson as unknown);
const wordByWordMetadata = QuranWordByWordMetadataSchema.parse(wordByWordMetadataJson as unknown);
const wordByWordValidation = QuranWordByWordValidationSchema.parse(wordByWordValidationJson as unknown);

export interface QuranStudySource {
  id: string;
  name: string;
  kind: "tafsir" | "word-by-word-translation";
  source: QuranSource;
}

export function getStudyAyah(surahNumber: number, ayahNumber: number): QuranStudyAyah | undefined {
  const surah = getSurah(surahNumber);
  if (!surah || !surah.ayahs.some((ayah) => ayah.number === ayahNumber)) return undefined;

  const verseKey = `${surahNumber}:${ayahNumber}`;
  const wordCount = wordByWordValidation.wordCountsByVerse[verseKey];
  const verseTafsir = tafsir[verseKey];
  if (!wordCount || !verseTafsir) return undefined;

  const words = Array.from({ length: wordCount }, (_, index) => {
    const number = index + 1;
    return {
      number,
      gloss: englishWordByWord[`${verseKey}:${number}`] ?? null,
    };
  });

  return QuranStudyAyahSchema.parse({
    surahNumber,
    ayahNumber,
    tafsir: verseTafsir.text,
    words,
    missingGlossNumbers: words.filter((word) => word.gloss === null).map((word) => word.number),
    sources: {
      tafsir: tafsirMetadata.source,
      wordByWord: wordByWordMetadata.source,
    },
  });
}

export function getStudySources(): QuranStudySource[] {
  return [
    {
      id: tafsirMetadata.id,
      name: tafsirMetadata.name,
      kind: tafsirMetadata.kind,
      source: tafsirMetadata.source,
    },
    {
      id: wordByWordMetadata.id,
      name: wordByWordMetadata.name,
      kind: wordByWordMetadata.kind,
      source: wordByWordMetadata.source,
    },
  ];
}