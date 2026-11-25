import { describe, expect, it } from "vitest";
import * as shared from "./index";
import {
  AyahReferenceSchema,
  BookmarkInputSchema,
  PersonalSyncBatchSchema,
  PersonalRecordIdSchema,
  ProfilePreferencesSchema,
  ReaderPreferencesSchema,
  UserNoteInputSchema,
} from "./index";

describe("AyahReferenceSchema", () => {
  it("accepts a reference within Quran bounds", () => {
    expect(AyahReferenceSchema.safeParse({ surahNumber: 2, ayahNumber: 255 }).success).toBe(true);
  });

  it("rejects out-of-range and non-integer references", () => {
    expect(AyahReferenceSchema.safeParse({ surahNumber: 0, ayahNumber: 1 }).success).toBe(false);
    expect(AyahReferenceSchema.safeParse({ surahNumber: 1, ayahNumber: 1.5 }).success).toBe(false);
  });
});

describe("personal feature schemas", () => {
  it("does not export email/password credentials", () => {
    expect("AuthCredentialsSchema" in shared).toBe(false);
  });

  it("validates profile language preferences", () => {
    expect(ProfilePreferencesSchema.safeParse({ preferredLanguage: "en" }).success).toBe(true);
    expect(ProfilePreferencesSchema.safeParse({ preferredLanguage: "english" }).success).toBe(false);
    expect(
      ReaderPreferencesSchema.safeParse({
        readingMode: "mushaf",
        translationId: "saheeh-international",
        showTransliteration: true,
        arabicFontSize: "large",
      }).success,
    ).toBe(true);
    expect(
      ReaderPreferencesSchema.safeParse({
        readingMode: "unsupported",
        translationId: "none",
        showTransliteration: true,
        arabicFontSize: "large",
      }).success,
    ).toBe(false);
  });

  it("validates ayah bookmarks, notes, and record identifiers", () => {
    expect(BookmarkInputSchema.safeParse({ surahNumber: 114, ayahNumber: 6 }).success).toBe(true);
    expect(
      UserNoteInputSchema.safeParse({ surahNumber: 1, ayahNumber: 1, content: "  Note  " })
        .data?.content,
    ).toBe("Note");
    expect(UserNoteInputSchema.safeParse({ surahNumber: 1, ayahNumber: 1, content: "  " }).success)
      .toBe(false);
    expect(PersonalRecordIdSchema.safeParse({ id: "not-a-uuid" }).success).toBe(false);
  });

  it("validates owner-bound, replay-safe sync operations", () => {
    expect(
      PersonalSyncBatchSchema.safeParse([
        {
          type: "bookmark-upsert",
          operationId: "00000000-0000-4000-8000-000000000001",
          ownerId: "user-1",
          changedAt: "2026-11-25T00:00:00.000Z",
          surahNumber: 1,
          ayahNumber: 1,
        },
      ]).success,
    ).toBe(true);
    expect(
      PersonalSyncBatchSchema.safeParse([
        {
          type: "note-upsert",
          operationId: "00000000-0000-4000-8000-000000000001",
          ownerId: "user-1",
          changedAt: "not-a-date",
          clientId: "00000000-0000-4000-8000-000000000002",
          surahNumber: 1,
          ayahNumber: 0,
          content: "invalid ayah",
        },
      ]).success,
    ).toBe(false);
  });
});