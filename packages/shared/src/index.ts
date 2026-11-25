import { z } from "zod";

export const AyahReferenceSchema = z
  .object({
    surahNumber: z.number().int().min(1).max(114),
    ayahNumber: z.number().int().min(1).max(286),
  })
  .strict();

export type AyahReference = z.infer<typeof AyahReferenceSchema>;

export const ProfilePreferencesSchema = z
  .object({
    preferredLanguage: z.string().trim().regex(/^[A-Za-z]{2}(?:-[A-Za-z0-9]{2,8})*$/u).max(35),
  })
  .strict();

export type ProfilePreferences = z.infer<typeof ProfilePreferencesSchema>;

export const ReaderPreferencesSchema = z
  .object({
    readingMode: z.enum(["continuous", "mushaf"]),
    translationId: z.enum(["saheeh-international", "none"]),
    showTransliteration: z.boolean(),
    arabicFontSize: z.enum(["comfortable", "large"]),
  })
  .strict();

export type ReaderPreferences = z.infer<typeof ReaderPreferencesSchema>;

export const BookmarkInputSchema = AyahReferenceSchema;

export const UserNoteInputSchema = AyahReferenceSchema.extend({
  content: z.string().trim().min(1).max(10_000),
}).strict();

export const PersonalRecordIdSchema = z.object({ id: z.string().uuid() }).strict();

const SyncOperationMetadataSchema = z.object({
  operationId: z.string().uuid(),
  ownerId: z.string().min(1).max(128),
  changedAt: z.string().datetime(),
});

export const PersonalSyncOperationSchema = z.discriminatedUnion("type", [
  SyncOperationMetadataSchema.extend({
    type: z.literal("bookmark-upsert"),
    surahNumber: z.number().int().min(1).max(114),
    ayahNumber: z.number().int().min(1).max(286),
  }).strict(),
  SyncOperationMetadataSchema.extend({
    type: z.literal("bookmark-delete"),
    surahNumber: z.number().int().min(1).max(114),
    ayahNumber: z.number().int().min(1).max(286),
  }).strict(),
  SyncOperationMetadataSchema.extend({
    type: z.literal("note-upsert"),
    clientId: z.string().uuid(),
    surahNumber: z.number().int().min(1).max(114),
    ayahNumber: z.number().int().min(1).max(286),
    content: z.string().trim().min(1).max(10_000),
  }).strict(),
  SyncOperationMetadataSchema.extend({
    type: z.literal("note-delete"),
    clientId: z.string().uuid(),
    surahNumber: z.number().int().min(1).max(114),
    ayahNumber: z.number().int().min(1).max(286),
  }).strict(),
  SyncOperationMetadataSchema.extend({
    type: z.literal("progress-upsert"),
    surahNumber: z.number().int().min(1).max(114),
    ayahNumber: z.number().int().min(1).max(286),
  }).strict(),
]);

export const PersonalSyncBatchSchema = z.array(PersonalSyncOperationSchema).max(100);

export type PersonalSyncOperation = z.infer<typeof PersonalSyncOperationSchema>;

export const ReadingPositionSchema = AyahReferenceSchema.extend({
  updatedAt: z.string().datetime().optional(),
});

export type ReadingPosition = z.infer<typeof ReadingPositionSchema>;