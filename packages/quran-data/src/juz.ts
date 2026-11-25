import { z } from "zod";
import juzJson from "./data/juz-boundaries.json";
import { EXPECTED_AYAH_COUNT, EXPECTED_SURAH_COUNT, SURAH_AYAH_COUNTS } from "./index";

const QuranAyahReferenceSchema = z
  .object({
    surah: z.number().int().min(1).max(EXPECTED_SURAH_COUNT),
    ayah: z.number().int().positive(),
  })
  .strict();

export const QuranJuzBoundarySchema = z
  .object({
    number: z.number().int().min(1).max(30),
    start: QuranAyahReferenceSchema,
    end: QuranAyahReferenceSchema,
  })
  .strict();

const QuranJuzProvenanceSchema = z
  .object({
    sourceName: z.string().min(1),
    sourceUrl: z.string().url(),
    verificationSource: z.string().min(1),
    verificationUrl: z.string().url(),
    edition: z.string().min(1),
    retrievedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
    license: z.null(),
    licenseStatus: z.literal("unknown"),
  })
  .strict();

function getAyahOrdinal(reference: { surah: number; ayah: number }) {
  if (
    !Number.isInteger(reference.surah) ||
    !Number.isInteger(reference.ayah) ||
    reference.surah < 1 ||
    reference.surah > EXPECTED_SURAH_COUNT
  ) {
    return undefined;
  }

  const ayahCount = SURAH_AYAH_COUNTS[reference.surah - 1];
  if (!ayahCount || reference.ayah < 1 || reference.ayah > ayahCount) return undefined;

  return (
    SURAH_AYAH_COUNTS.slice(0, reference.surah - 1).reduce((total, count) => total + count, 0) +
    reference.ayah
  );
}

export const QuranJuzResourceSchema = z
  .object({
    provenance: QuranJuzProvenanceSchema,
    juzs: z.array(QuranJuzBoundarySchema).length(30),
  })
  .strict()
  .superRefine((resource, context) => {
    let previousEndOrdinal = 0;

    resource.juzs.forEach((juz, index) => {
      if (juz.number !== index + 1) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Expected Juz number ${index + 1}, received ${juz.number}`,
          path: ["juzs", index, "number"],
        });
      }

      const startOrdinal = getAyahOrdinal(juz.start);
      const endOrdinal = getAyahOrdinal(juz.end);

      if (startOrdinal === undefined) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid Juz ${juz.number} start ayah ${juz.start.surah}:${juz.start.ayah}`,
          path: ["juzs", index, "start"],
        });
      }

      if (endOrdinal === undefined) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid Juz ${juz.number} end ayah ${juz.end.surah}:${juz.end.ayah}`,
          path: ["juzs", index, "end"],
        });
      }

      if (startOrdinal === undefined || endOrdinal === undefined) return;

      if (startOrdinal > endOrdinal) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Juz ${juz.number} starts after it ends`,
          path: ["juzs", index],
        });
      }

      if (startOrdinal !== previousEndOrdinal + 1) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Juz ${juz.number} does not continue the preceding ayah range`,
          path: ["juzs", index, "start"],
        });
      }

      previousEndOrdinal = endOrdinal;
    });

    if (getAyahOrdinal(resource.juzs[0]?.start ?? { surah: 0, ayah: 0 }) !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Juz ranges must begin at 1:1",
        path: ["juzs", 0, "start"],
      });
    }

    if (previousEndOrdinal !== EXPECTED_AYAH_COUNT) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Juz ranges must end at ayah ${EXPECTED_AYAH_COUNT}`,
        path: ["juzs", resource.juzs.length - 1, "end"],
      });
    }
  });

export type QuranJuzBoundary = z.infer<typeof QuranJuzBoundarySchema>;
export type QuranJuzResource = z.infer<typeof QuranJuzResourceSchema>;

export function parseQuranJuzResource(input: unknown): QuranJuzResource {
  return QuranJuzResourceSchema.parse(input);
}

const juzResource = parseQuranJuzResource(juzJson as unknown);

function copyBoundary(juz: QuranJuzBoundary): QuranJuzBoundary {
  return { ...juz, start: { ...juz.start }, end: { ...juz.end } };
}

export function getJuzIndex(): QuranJuzBoundary[] {
  return juzResource.juzs.map(copyBoundary);
}

export function getJuzByNumber(number: number): QuranJuzBoundary | undefined {
  if (!Number.isInteger(number)) return undefined;
  const juz = juzResource.juzs[number - 1];
  return juz?.number === number ? copyBoundary(juz) : undefined;
}

export function getJuzForAyah(surah: number, ayah: number): QuranJuzBoundary | undefined {
  const ordinal = getAyahOrdinal({ surah, ayah });
  if (ordinal === undefined) return undefined;

  const juz = juzResource.juzs.find((item) => {
    const startOrdinal = getAyahOrdinal(item.start);
    const endOrdinal = getAyahOrdinal(item.end);
    return startOrdinal !== undefined && endOrdinal !== undefined && ordinal >= startOrdinal && ordinal <= endOrdinal;
  });

  return juz ? copyBoundary(juz) : undefined;
}